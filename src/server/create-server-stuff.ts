import {Map} from 'immutable'
import {Action, Store} from 'redux'
import {ConnectionNodeType, IConnectable} from '../common/common-types'
import {calculatePositionsGivenConnections} from '../common/compute-positions'
import {makeMidiClipEvent, MidiClipEvents} from '../common/midi-types'
import {MidiNotes} from '../common/MidiNote'
import {
	addBasicSampler, addBasicSynthesizer, addClient,
	addGridSequencer, addInfiniteSequencer, addPosition,
	addSimpleReverb, BasicSamplerState,
	BasicSynthesizerState, ClientState, Connection, connectionsActions,
	createRoomAction, createSequencerEvents, deletePositions,
	deleteThingsAny, getConnectionNodeInfo, globalClockActions,
	GridSequencerState, InfiniteSequencerState,
	InfiniteSequencerStyle, IServerState, makePosition,
	makeSequencerEvents, REPLACE_SHAMU_GRAPH_STATE, roomSettingsActions, SavedRoom, selectAllConnections, selectAllPositions, selectAllVirtualKeyboardIds, selectConnectionsWithSourceOrTargetIds, shamuGraphActions, ShamuGraphState, SimpleReverbState, updatePositions,
} from '../common/redux'

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

	const serverStuffDefinitions = Object.freeze({
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
	})

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
	// connectNodes(serverStuff.get('arp')!.source, serverStuff.get('arp2')!.target)

	serverStuff.forEach(x => {
		connectNodes(x.target, masterAudioOutput)
	})

	// const simpleReverb2 = createSource({
	// 	name: 'Reverb A',
	// 	type: ConnectionNodeType.simpleReverb,
	// }) as SimpleReverbState

	// dispatchToRoom(addPosition(makePosition({
	// 	id: simpleReverb2.id,
	// 	targetType: ConnectionNodeType.simpleReverb,
	// })))

	// connectNodes(simpleReverb2, masterAudioOutput)

	interface CreateSourceAndTargetArgs {
		source: CreateSourceArgs
		target: {
			type: ConnectionNodeType,
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
					args.events!,
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
					args.events!,
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
				dispatchToRoom(addBasicSampler(y))
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
		{notes: MidiNotes([36]), startBeat: 0, durationBeats: 1},
		{notes: MidiNotes([40]), startBeat: 1, durationBeats: 1},
		{notes: MidiNotes([43]), startBeat: 2, durationBeats: 1},
		{notes: MidiNotes([47]), startBeat: 3, durationBeats: 1},
		{notes: MidiNotes([48]), startBeat: 4, durationBeats: 1},
		{notes: MidiNotes([47]), startBeat: 5, durationBeats: 1},
		{notes: MidiNotes([43]), startBeat: 6, durationBeats: 1},
		{notes: MidiNotes([40]), startBeat: 7, durationBeats: 1},
		{notes: MidiNotes([36]), startBeat: 8, durationBeats: 1},
		{notes: MidiNotes([40]), startBeat: 9, durationBeats: 1},
		{notes: MidiNotes([43]), startBeat: 10, durationBeats: 1},
		{notes: MidiNotes([47]), startBeat: 11, durationBeats: 1},
		{notes: MidiNotes([48]), startBeat: 12, durationBeats: 1},
		{notes: MidiNotes([47]), startBeat: 13, durationBeats: 1},
		{notes: MidiNotes([43]), startBeat: 14, durationBeats: 1},
		{notes: MidiNotes([40]), startBeat: 15, durationBeats: 1},
		{notes: MidiNotes([36]), startBeat: 16, durationBeats: 1},
		{notes: MidiNotes([40]), startBeat: 17, durationBeats: 1},
		{notes: MidiNotes([43]), startBeat: 18, durationBeats: 1},
		{notes: MidiNotes([47]), startBeat: 19, durationBeats: 1},
		{notes: MidiNotes([48]), startBeat: 20, durationBeats: 1},
		{notes: MidiNotes([47]), startBeat: 21, durationBeats: 1},
		{notes: MidiNotes([43]), startBeat: 22, durationBeats: 1},
		{notes: MidiNotes([40]), startBeat: 23, durationBeats: 1},
		{notes: MidiNotes([36]), startBeat: 24, durationBeats: 1},
		{notes: MidiNotes([40]), startBeat: 25, durationBeats: 1},
		{notes: MidiNotes([43]), startBeat: 26, durationBeats: 1},
		{notes: MidiNotes([47]), startBeat: 27, durationBeats: 1},
		{notes: MidiNotes([48]), startBeat: 28, durationBeats: 1},
		{notes: MidiNotes([47]), startBeat: 29, durationBeats: 1},
		{notes: MidiNotes([43]), startBeat: 30, durationBeats: 1},
		{notes: MidiNotes([40]), startBeat: 31, durationBeats: 1},
	])
}

function getInitialInfiniteSequencerEvents() {
	return makeSequencerEvents([
		{notes: MidiNotes([60]), startBeat: 0, durationBeats: 1},
		{notes: MidiNotes([64]), startBeat: 1, durationBeats: 1},
		{notes: MidiNotes([67]), startBeat: 2, durationBeats: 1},
		{notes: MidiNotes([71]), startBeat: 3, durationBeats: 1},
		{notes: MidiNotes([72]), startBeat: 4, durationBeats: 1},
		{notes: MidiNotes([71]), startBeat: 5, durationBeats: 1},
		{notes: MidiNotes([67]), startBeat: 6, durationBeats: 1},
		{notes: MidiNotes([64]), startBeat: 7, durationBeats: 1},
	])
}

export function loadServerStuff(room: string, serverStore: Store<IServerState>, roomDataToLoad: SavedRoom) {
	const serverClient = ClientState.createServerClient()
	const addClientAction = addClient(serverClient)

	dispatchToRoom(addClientAction)

	dispatchToRoom(connectionsActions.updateAll(roomDataToLoad.connections))
	dispatchToRoom(shamuGraphActions.replace(roomDataToLoad.shamuGraph))
	dispatchToRoom(updatePositions(roomDataToLoad.positions))
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

	function dispatchToRoom(action: Action) {
		return serverStore.dispatch(createRoomAction(action, room))
	}
}
