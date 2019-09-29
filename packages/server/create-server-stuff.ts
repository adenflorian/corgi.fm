import {List, Map} from 'immutable'
import {Action, Store} from 'redux'
import {ConnectionNodeType, IConnectable} from '@corgifm/common/common-types'
import {calculatePositionsGivenConnections} from '@corgifm/common/compute-positions'
import {MidiClipEvents, makeMidiClipEvent} from '@corgifm/common/midi-types'
import {transformLoadedSave} from '@corgifm/common/saving-and-loading'
import {
	basicSamplerActions, addBasicSynthesizer, addClient,
	addGridSequencer, addInfiniteSequencer, addPosition,
	addSimpleReverb, BasicSamplerState,
	BasicSynthesizerState, ClientState, Connection, connectionsActions,
	createRoomAction, deletePositions,
	deleteThingsAny, findNodeInfo, globalClockActions,
	GridSequencerState, InfiniteSequencerState,
	InfiniteSequencerStyle, IServerState, makePosition,
	makeSequencerEvents, replacePositions, roomSettingsActions, SavedRoom,
	selectAllConnections, selectAllPositions, selectAllVirtualKeyboardIds,
	selectConnectionsWithSourceOrTargetIds, shamuGraphActions,
	SimpleReverbState, updatePositions, BetterSequencerState,
	addBetterSequencer, createSequencerEvents, RoomType, expNodesActions,
	expPositionActions, makeExpPosition, makeExpNodeState, expConnectionsActions, ExpConnection,
} from '@corgifm/common/redux'
import {logger} from '@corgifm/common/logger'
import {serverClientId} from '@corgifm/common/common-constants'

const masterAudioOutput: IConnectable = findNodeInfo(ConnectionNodeType.audioOutput).stateSelector({} as any, '')
const masterClock: IConnectable = findNodeInfo(ConnectionNodeType.masterClock).stateSelector({} as any, '')

export function createServerStuff(room: string, serverStore: Store<IServerState>, type: RoomType) {
	switch (type) {
		case RoomType.Experimental: return createServerStuffExperimental(room, serverStore)
		case RoomType.Normal:
		default: return createServerStuffNormal(room, serverStore)
	}
}

export function createServerStuffExperimental(room: string, serverStore: Store<IServerState>) {
	logger.log('todo')

	const audioOutput = makeExpNodeState({
		type: 'audioOutput',
	})

	dispatchToRoom(expNodesActions.add(audioOutput))

	dispatchToRoom(expPositionActions.add(
		makeExpPosition({
			id: audioOutput.id,
			ownerId: serverClientId,
			x: 700,
			y: 0,
		})))

	const gain = makeExpNodeState({
		type: 'gain',
	})

	dispatchToRoom(expNodesActions.add(gain))

	dispatchToRoom(expPositionActions.add(
		makeExpPosition({
			id: gain.id,
			ownerId: serverClientId,
			x: 0,
			y: 250,
		})))

	const filter = makeExpNodeState({
		type: 'filter',
	})

	dispatchToRoom(expNodesActions.add(filter))

	dispatchToRoom(expPositionActions.add(
		makeExpPosition({
			id: filter.id,
			ownerId: serverClientId,
			x: 350,
			y: 0,
		})))

	const osc1 = makeExpNodeState({
		type: 'oscillator',
	})

	dispatchToRoom(expNodesActions.add(osc1))

	dispatchToRoom(expPositionActions.add(
		makeExpPosition({
			id: osc1.id,
			ownerId: serverClientId,
			x: 0,
			y: 0,
		})))

	const osc2 = makeExpNodeState({
		type: 'oscillator',
	})

	dispatchToRoom(expNodesActions.add(osc2))

	dispatchToRoom(expPositionActions.add(
		makeExpPosition({
			id: osc2.id,
			ownerId: serverClientId,
			x: -350,
			y: 250,
		})))

	dispatchToRoom(expConnectionsActions.add(new ExpConnection(
		osc1.id,
		osc1.type,
		filter.id,
		filter.type,
		0,
		0,
	)))

	dispatchToRoom(expConnectionsActions.add(new ExpConnection(
		filter.id,
		filter.type,
		audioOutput.id,
		audioOutput.type,
		0,
		0,
	)))

	dispatchToRoom(expConnectionsActions.add(new ExpConnection(
		osc2.id,
		osc2.type,
		gain.id,
		gain.type,
		0,
		0,
	)))

	dispatchToRoom(expConnectionsActions.add(new ExpConnection(
		gain.id,
		gain.type,
		filter.id,
		filter.type,
		0,
		1,
	)))

	function dispatchToRoom(action: Action) {
		return serverStore.dispatch(createRoomAction(action, room))
	}
}

export function createServerStuffNormal(room: string, serverStore: Store<IServerState>) {
	const serverClient = ClientState.createServerClient()
	const addClientAction = addClient(serverClient)

	dispatchToRoom(addClientAction)

	dispatchToRoom(addPosition(
		makePosition({
			...masterClock,
			ownerId: serverClient.id,
			targetType: masterClock.type,
			color: findNodeInfo(masterClock.type).color,
		})))

	dispatchToRoom(addPosition(
		makePosition({
			...masterAudioOutput,
			ownerId: serverClient.id,
			targetType: masterAudioOutput.type,
			color: findNodeInfo(masterAudioOutput.type).color,
		})))

	// Reverb
	const simpleReverb = createSource({
		type: ConnectionNodeType.simpleReverb,
	}) as SimpleReverbState

	dispatchToRoom(addPosition(
		makePosition({
			...simpleReverb,
			ownerId: serverClient.id,
			targetType: simpleReverb.type,
			color: findNodeInfo(simpleReverb.type).color,
		})))

	connectNodes(simpleReverb, masterAudioOutput)

	function foo() {
		let i = 0
		return createSequencerEvents(32)
			.map(() => (makeMidiClipEvent({
				note: i + 60,
				startBeat: i++,
				durationBeats: 1,
			})))
	}

	const serverStuffDefinitions = {
		melody: {
			source: {
				type: ConnectionNodeType.betterSequencer,
				events: foo(),
			},
			target: {
				type: ConnectionNodeType.basicSynthesizer,
			},
		},
		arp: {
			source: {
				type: ConnectionNodeType.infiniteSequencer,
				events: getInitialInfiniteSequencerEvents(),
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
				ownerId: serverClient.id,
				targetType: target.type,
				color: findNodeInfo(target.type).color,
			})))

		const source = createSource(options.source)
		dispatchToRoom(addPosition(
			makePosition({
				...source,
				ownerId: serverClient.id,
				targetType: source.type,
				color: findNodeInfo(source.type).color,
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
		infinityStyle?: InfiniteSequencerStyle
		events?: MidiClipEvents
		isPlaying?: boolean
	}

	function createSource(args: CreateSourceArgs) {
		switch (args.type) {
			case ConnectionNodeType.gridSequencer:
				const x = new GridSequencerState(
					args.events,
					args.isPlaying,
				)
				dispatchToRoom(addGridSequencer(x))
				// makeServerOwnedNode(args.type, x)
				return x
			case ConnectionNodeType.betterSequencer:
				const w = new BetterSequencerState(
					args.events,
					args.isPlaying,
				)
				dispatchToRoom(addBetterSequencer(w))
				// makeServerOwnedNode(args.type, w)
				return w
			case ConnectionNodeType.infiniteSequencer:
				const y = new InfiniteSequencerState(
					args.infinityStyle || InfiniteSequencerStyle.colorGrid,
					args.events,
					args.isPlaying,
				)
				dispatchToRoom(addInfiniteSequencer(y))
				// makeServerOwnedNode(args.type, y)
				return y
			case ConnectionNodeType.simpleReverb:
				const z = new SimpleReverbState()
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
				const x = new BasicSynthesizerState()
				dispatchToRoom(addBasicSynthesizer(x))
				// makeServerOwnedNode(type, x)
				return x
			case ConnectionNodeType.basicSampler:
				const y = new BasicSamplerState()
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
			0,
			0,
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
	return makeSequencerEvents(List([
		makeMidiClipEvent({note: 48, startBeat: 0, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 1, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 2, durationBeats: 1}),
		makeMidiClipEvent({note: 48, startBeat: 3, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 4, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 5, durationBeats: 1}),
		makeMidiClipEvent({note: 48, startBeat: 6, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 7, durationBeats: 1}),
		makeMidiClipEvent({note: 48, startBeat: 8, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 9, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 10, durationBeats: 1}),
		makeMidiClipEvent({note: 48, startBeat: 11, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 12, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 13, durationBeats: 1}),
		makeMidiClipEvent({note: 48, startBeat: 14, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 15, durationBeats: 1}),
		makeMidiClipEvent({note: 48, startBeat: 16, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 17, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 18, durationBeats: 1}),
		makeMidiClipEvent({note: 48, startBeat: 19, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 20, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 21, durationBeats: 1}),
		makeMidiClipEvent({note: 48, startBeat: 22, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 23, durationBeats: 1}),
		makeMidiClipEvent({note: 48, startBeat: 24, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 25, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 26, durationBeats: 1}),
		makeMidiClipEvent({note: 48, startBeat: 27, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 28, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 29, durationBeats: 1}),
		makeMidiClipEvent({note: 48, startBeat: 30, durationBeats: 1}),
		makeMidiClipEvent({note: -1, startBeat: 31, durationBeats: 1}),
	]))
}

function getInitialInfiniteSequencerEvents() {
	return makeSequencerEvents(List([
		makeMidiClipEvent({note: 60, startBeat: 0, durationBeats: 1}),
		makeMidiClipEvent({note: 67, startBeat: 1, durationBeats: 1}),
		makeMidiClipEvent({note: 74, startBeat: 2, durationBeats: 1}),
		makeMidiClipEvent({note: 76, startBeat: 3, durationBeats: 1}),
		makeMidiClipEvent({note: 60, startBeat: 4, durationBeats: 1}),
		makeMidiClipEvent({note: 67, startBeat: 5, durationBeats: 1}),
		makeMidiClipEvent({note: 74, startBeat: 6, durationBeats: 1}),
		makeMidiClipEvent({note: 76, startBeat: 7, durationBeats: 1}),
		makeMidiClipEvent({note: 60, startBeat: 8, durationBeats: 1}),
		makeMidiClipEvent({note: 67, startBeat: 9, durationBeats: 1}),
		makeMidiClipEvent({note: 74, startBeat: 10, durationBeats: 1}),
		makeMidiClipEvent({note: 76, startBeat: 11, durationBeats: 1}),
		makeMidiClipEvent({note: 60, startBeat: 12, durationBeats: 1}),
		makeMidiClipEvent({note: 67, startBeat: 13, durationBeats: 1}),
		makeMidiClipEvent({note: 74, startBeat: 14, durationBeats: 1}),
		makeMidiClipEvent({note: 76, startBeat: 15, durationBeats: 1}),

		makeMidiClipEvent({note: 58, startBeat: 16, durationBeats: 1}),
		makeMidiClipEvent({note: 65, startBeat: 17, durationBeats: 1}),
		makeMidiClipEvent({note: 72, startBeat: 18, durationBeats: 1}),
		makeMidiClipEvent({note: 70, startBeat: 19, durationBeats: 1}),
		makeMidiClipEvent({note: 58, startBeat: 20, durationBeats: 1}),
		makeMidiClipEvent({note: 65, startBeat: 21, durationBeats: 1}),
		makeMidiClipEvent({note: 72, startBeat: 22, durationBeats: 1}),
		makeMidiClipEvent({note: 70, startBeat: 23, durationBeats: 1}),
		makeMidiClipEvent({note: 58, startBeat: 24, durationBeats: 1}),
		makeMidiClipEvent({note: 65, startBeat: 25, durationBeats: 1}),
		makeMidiClipEvent({note: 72, startBeat: 26, durationBeats: 1}),
		makeMidiClipEvent({note: 70, startBeat: 27, durationBeats: 1}),
		makeMidiClipEvent({note: 58, startBeat: 28, durationBeats: 1}),
		makeMidiClipEvent({note: 65, startBeat: 29, durationBeats: 1}),
		makeMidiClipEvent({note: 72, startBeat: 30, durationBeats: 1}),
		makeMidiClipEvent({note: 70, startBeat: 31, durationBeats: 1}),
	]))
}

export function loadServerStuff(room: string, serverStore: Store<IServerState>, roomDataToLoad: SavedRoom, ownerId: Id) {
	const transformedRoomSave = transformLoadedSave(roomDataToLoad)

	const serverClient = ClientState.createServerClient()
	const addClientAction = addClient(serverClient)

	const getRoomState = () => serverStore.getState().roomStores.get(room)!

	dispatchToRoom(addClientAction)

	dispatchToRoom(connectionsActions.replaceAll(transformedRoomSave.connections))
	dispatchToRoom(shamuGraphActions.replace(transformedRoomSave.shamuGraph))
	const newPositions = Map(transformedRoomSave.positions).map(position => {
		return {
			...position,
			// width: nodeState.width,
			// height: nodeState.height,
		}
	})
	dispatchToRoom(replacePositions(newPositions))
	dispatchToRoom(roomSettingsActions.replaceAll(transformedRoomSave.roomSettings))
	dispatchToRoom(globalClockActions.replace(transformedRoomSave.globalClock))

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
