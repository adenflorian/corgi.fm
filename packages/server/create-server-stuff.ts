import {Map} from 'immutable'
import {Action, Store} from 'redux'
import {ConnectionNodeType, IConnectable} from '@corgifm/common/common-types'
import {calculatePositionsGivenConnections} from '@corgifm/common/compute-positions'
import {MidiClipEvents} from '@corgifm/common/midi-types'
import {MidiNotes} from '@corgifm/common/MidiNote'
import {
	basicSamplerActions, addBasicSynthesizer, addClient,
	addGridSequencer, addInfiniteSequencer, addPosition,
	addSimpleReverb, BasicSamplerState,
	BasicSynthesizerState, ClientState, Connection, connectionsActions,
	createRoomAction, deletePositions,
	deleteThingsAny, getConnectionNodeInfo, globalClockActions,
	GridSequencerState, InfiniteSequencerState,
	InfiniteSequencerStyle, IServerState, makePosition,
	makeSequencerEvents, replacePositions, roomSettingsActions, SavedRoom,
	selectAllConnections, selectAllPositions, selectAllVirtualKeyboardIds,
	selectConnectionsWithSourceOrTargetIds, shamuGraphActions,
	SimpleReverbState, updatePositions,
} from '@corgifm/common/redux'

const masterAudioOutput: IConnectable = getConnectionNodeInfo(ConnectionNodeType.audioOutput).stateSelector({} as any, '')
const masterClock: IConnectable = getConnectionNodeInfo(ConnectionNodeType.masterClock).stateSelector({} as any, '')

export function createServerStuff(room: string, serverStore: Store<IServerState>) {
	const serverClient = ClientState.createServerClient()
	const addClientAction = addClient(serverClient)

	dispatchToRoom(addClientAction)

	dispatchToRoom(addPosition(
		makePosition({
			...masterClock,
			targetType: masterClock.type,
		})))

	dispatchToRoom(addPosition(
		makePosition({
			...masterAudioOutput,
			targetType: masterAudioOutput.type,
		})))

	// Reverb
	const simpleReverb = createSource({
		name: 'Reverb A',
		type: ConnectionNodeType.simpleReverb,
	}) as SimpleReverbState

	dispatchToRoom(addPosition(
		makePosition({
			...simpleReverb,
			targetType: simpleReverb.type,
		})))

	connectNodes(simpleReverb, masterAudioOutput)

	const serverStuffDefinitions = {
		melody: {
			source: {
				type: ConnectionNodeType.gridSequencer,
				events: getMelodyNotes(),
				name: getConnectionNodeInfo(ConnectionNodeType.gridSequencer).typeName,
				notesToShow: 24,
			},
			target: {
				type: ConnectionNodeType.basicSynthesizer,
			},
		},
		arp: {
			source: {
				type: ConnectionNodeType.infiniteSequencer,
				events: getInitialInfiniteSequencerEvents(),
				name: getConnectionNodeInfo(ConnectionNodeType.infiniteSequencer).typeName,
				infinityStyle: InfiniteSequencerStyle.colorGrid,
				isPlaying: true,
			},
			target: {
				type: ConnectionNodeType.basicSampler,
			},
		},
	} as const

	const serverStuff = createSourceAndTargets(serverStuffDefinitions)

	// Update positions
	const roomState = serverStore.getState().roomStores.get(room)!

	dispatchToRoom(
		updatePositions(
			calculatePositionsGivenConnections(
				selectAllPositions(roomState),
				selectAllConnections(roomState),
			),
		),
	)

	// Do extra connections after calculating positions, so that it doesn't mess up positions
	connectNodes(serverStuff.get('melody')!.source, serverStuff.get('arp')!.target)

	serverStuff.forEach(x => {
		connectNodes(x.target, masterAudioOutput)
	})

	interface CreateSourceAndTargetArgs {
		source: CreateSourceArgs
		target: {
			type: ConnectionNodeType
		}
	}

	function createSourceAndTargets(defs: typeof serverStuffDefinitions) {
		return Map(defs).map(createSourceAndTarget)
	}

	function createSourceAndTarget(options: CreateSourceAndTargetArgs) {
		const target = createTarget(options.target.type)
		dispatchToRoom(addPosition(
			makePosition({
				...target,
				targetType: target.type,
			})))

		const source = createSource(options.source)
		dispatchToRoom(addPosition(
			makePosition({
				...source,
				targetType: source.type,
			})))

		connectNodes(source, target)

		connectNodes(target, simpleReverb)

		connectNodes(masterClock, source)

		return {
			source,
			target,
		}
	}

	interface CreateSourceArgs {
		type: ConnectionNodeType
		name: string
		infinityStyle?: InfiniteSequencerStyle
		events?: MidiClipEvents
		notesToShow?: number
		isPlaying?: boolean
	}

	function createSource(args: CreateSourceArgs) {
		switch (args.type) {
			case ConnectionNodeType.gridSequencer:
				const x = new GridSequencerState(
					serverClient.id,
					args.name,
					args.notesToShow || 24,
					args.events,
					args.isPlaying,
				)
				dispatchToRoom(addGridSequencer(x))
				// makeServerOwnedNode(args.type, x)
				return x
			case ConnectionNodeType.infiniteSequencer:
				const y = new InfiniteSequencerState(
					serverClient.id,
					args.name,
					args.infinityStyle || InfiniteSequencerStyle.colorGrid,
					args.events,
					args.isPlaying,
				)
				dispatchToRoom(addInfiniteSequencer(y))
				// makeServerOwnedNode(args.type, y)
				return y
			case ConnectionNodeType.simpleReverb:
				const z = new SimpleReverbState(serverClient.id)
				dispatchToRoom(addSimpleReverb(z))
				// makeServerOwnedNode(args.type, z)
				return z
			default:
				throw new Error('Invalid type')
		}
	}

	function createTarget(type: ConnectionNodeType) {
		switch (type) {
			case ConnectionNodeType.basicSynthesizer:
				const x = new BasicSynthesizerState(serverClient.id)
				dispatchToRoom(addBasicSynthesizer(x))
				// makeServerOwnedNode(type, x)
				return x
			case ConnectionNodeType.basicSampler:
				const y = new BasicSamplerState(serverClient.id)
				dispatchToRoom(basicSamplerActions.add(y))
				// makeServerOwnedNode(type, y)
				return y
			default:
				throw new Error('Invalid type')
		}
	}

	function connectNodes(source: IConnectable, target: IConnectable) {
		dispatchToRoom(connectionsActions.add(new Connection(
			source.id,
			source.type,
			target.id,
			target.type,
		)))
	}

	// function makeServerOwnedNode(type: ConnectionNodeType, specialState: NodeSpecialState) {
	// 	return dispatchToRoom(shamuNodesActions.add(makeNodeState({
	// 		ownerId: serverClient.id,
	// 		type,
	// 		specialState,
	// 	})))
	// }

	function dispatchToRoom(action: Action) {
		return serverStore.dispatch(createRoomAction(action, room))
	}
}

function getMelodyNotes() {
	return makeSequencerEvents([
		{notes: MidiNotes([48]), startBeat: 0, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 1, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 2, durationBeats: 1},
		{notes: MidiNotes([48]), startBeat: 3, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 4, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 5, durationBeats: 1},
		{notes: MidiNotes([48]), startBeat: 6, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 7, durationBeats: 1},
		{notes: MidiNotes([48]), startBeat: 8, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 9, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 10, durationBeats: 1},
		{notes: MidiNotes([48]), startBeat: 11, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 12, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 13, durationBeats: 1},
		{notes: MidiNotes([48]), startBeat: 14, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 15, durationBeats: 1},
		{notes: MidiNotes([48]), startBeat: 16, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 17, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 18, durationBeats: 1},
		{notes: MidiNotes([48]), startBeat: 19, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 20, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 21, durationBeats: 1},
		{notes: MidiNotes([48]), startBeat: 22, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 23, durationBeats: 1},
		{notes: MidiNotes([48]), startBeat: 24, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 25, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 26, durationBeats: 1},
		{notes: MidiNotes([48]), startBeat: 27, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 28, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 29, durationBeats: 1},
		{notes: MidiNotes([48]), startBeat: 30, durationBeats: 1},
		{notes: MidiNotes([]), startBeat: 31, durationBeats: 1},
	])
}

function getInitialInfiniteSequencerEvents() {
	return makeSequencerEvents([
		{notes: MidiNotes([60]), startBeat: 0, durationBeats: 1},
		{notes: MidiNotes([67]), startBeat: 1, durationBeats: 1},
		{notes: MidiNotes([74]), startBeat: 2, durationBeats: 1},
		{notes: MidiNotes([76]), startBeat: 3, durationBeats: 1},
		{notes: MidiNotes([60]), startBeat: 4, durationBeats: 1},
		{notes: MidiNotes([67]), startBeat: 5, durationBeats: 1},
		{notes: MidiNotes([74]), startBeat: 6, durationBeats: 1},
		{notes: MidiNotes([76]), startBeat: 7, durationBeats: 1},
		{notes: MidiNotes([60]), startBeat: 8, durationBeats: 1},
		{notes: MidiNotes([67]), startBeat: 9, durationBeats: 1},
		{notes: MidiNotes([74]), startBeat: 10, durationBeats: 1},
		{notes: MidiNotes([76]), startBeat: 11, durationBeats: 1},
		{notes: MidiNotes([60]), startBeat: 12, durationBeats: 1},
		{notes: MidiNotes([67]), startBeat: 13, durationBeats: 1},
		{notes: MidiNotes([74]), startBeat: 14, durationBeats: 1},
		{notes: MidiNotes([76]), startBeat: 15, durationBeats: 1},

		{notes: MidiNotes([58]), startBeat: 16, durationBeats: 1},
		{notes: MidiNotes([65]), startBeat: 17, durationBeats: 1},
		{notes: MidiNotes([72]), startBeat: 18, durationBeats: 1},
		{notes: MidiNotes([70]), startBeat: 19, durationBeats: 1},
		{notes: MidiNotes([58]), startBeat: 20, durationBeats: 1},
		{notes: MidiNotes([65]), startBeat: 21, durationBeats: 1},
		{notes: MidiNotes([72]), startBeat: 22, durationBeats: 1},
		{notes: MidiNotes([70]), startBeat: 23, durationBeats: 1},
		{notes: MidiNotes([58]), startBeat: 24, durationBeats: 1},
		{notes: MidiNotes([65]), startBeat: 25, durationBeats: 1},
		{notes: MidiNotes([72]), startBeat: 26, durationBeats: 1},
		{notes: MidiNotes([70]), startBeat: 27, durationBeats: 1},
		{notes: MidiNotes([58]), startBeat: 28, durationBeats: 1},
		{notes: MidiNotes([65]), startBeat: 29, durationBeats: 1},
		{notes: MidiNotes([72]), startBeat: 30, durationBeats: 1},
		{notes: MidiNotes([70]), startBeat: 31, durationBeats: 1},
	])
}

export function loadServerStuff(room: string, serverStore: Store<IServerState>, roomDataToLoad: SavedRoom, ownerId: Id) {
	const serverClient = ClientState.createServerClient()
	const addClientAction = addClient(serverClient)

	dispatchToRoom(addClientAction)

	dispatchToRoom(connectionsActions.replaceAll(roomDataToLoad.connections))
	dispatchToRoom(shamuGraphActions.replace(roomDataToLoad.shamuGraph))
	dispatchToRoom(replacePositions(roomDataToLoad.positions))
	dispatchToRoom(roomSettingsActions.replaceAll(roomDataToLoad.roomSettings))
	dispatchToRoom(globalClockActions.replace(roomDataToLoad.globalClock))

	const getRoomState = () => serverStore.getState().roomStores.get(room)!

	const keyboardIds = selectAllVirtualKeyboardIds(getRoomState())
	const keyboardConnectionIds = selectConnectionsWithSourceOrTargetIds(getRoomState(), keyboardIds)
		.toList()
		.map(x => x.id)

	dispatchToRoom(connectionsActions.delete(keyboardConnectionIds))
	dispatchToRoom(deleteThingsAny(keyboardIds))
	dispatchToRoom(deletePositions(keyboardIds))

	dispatchToRoom(roomSettingsActions.setOwner(ownerId))

	function dispatchToRoom(action: Action) {
		return serverStore.dispatch(createRoomAction(action, room))
	}
}
