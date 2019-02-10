import {Map} from 'immutable'
import {Action, Store} from 'redux'
import {ConnectionNodeType, IConnectable} from '../common/common-types'
import {MidiNotes} from '../common/MidiNote'
import {
	addBasicSampler, addBasicSynthesizer, addClient,
	addGridSequencer, addInfiniteSequencer, addPosition,
	BasicSamplerState, BasicSynthesizerState,
	calculateExtremes, calculatePositionsGivenConnections, ClientState,
	Connection, connectionsActions, createRoomAction,
	createSequencerEvents, GridSequencerState, IConnection,
	IConnections, InfiniteSequencerState,
	InfiniteSequencerStyle, IPositions, IServerState, makePosition,
	makeSequencerEvents, MASTER_AUDIO_OUTPUT_TARGET_ID,
	MASTER_CLOCK_SOURCE_ID, NodeSpecialState, selectAllConnections, selectAllPositions, selectConnectionsWithTargetIds, selectConnectionsWithTargetIds2, SequencerEvents, updatePositions,
} from '../common/redux'

const masterAudioOutput: IConnectable = Object.freeze({
	id: MASTER_AUDIO_OUTPUT_TARGET_ID,
	type: ConnectionNodeType.audioOutput,
	color: '',
})

const masterClock: IConnectable = Object.freeze({
	id: MASTER_CLOCK_SOURCE_ID,
	type: ConnectionNodeType.masterClock,
	color: '',
})

export function createServerStuff(room: string, serverStore: Store<IServerState>) {
	const serverClient = ClientState.createServerClient()
	const addClientAction = addClient(serverClient)

	dispatchToRoom(addClientAction)

	dispatchToRoom(addPosition(
		makePosition({id: MASTER_CLOCK_SOURCE_ID, targetType: ConnectionNodeType.masterClock})))

	dispatchToRoom(addPosition(
		makePosition({id: MASTER_AUDIO_OUTPUT_TARGET_ID, targetType: ConnectionNodeType.audioOutput})))

	const serverStuffDefinitions = Object.freeze({
		bass: {
			source: {
				type: ConnectionNodeType.gridSequencer,
				events: getBassNotes(),
				name: 'Bass',
				notesToShow: 12,
			},
			target: {
				type: ConnectionNodeType.basicSampler,
			},
		},
		melody: {
			source: {
				type: ConnectionNodeType.gridSequencer,
				events: getMelodyNotes(),
				name: 'Melody',
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
				name: 'Arp',
				infinityStyle: InfiniteSequencerStyle.colorGrid,
			},
			target: {
				type: ConnectionNodeType.basicSampler,
			},
		},
		arp2: {
			source: {
				type: ConnectionNodeType.infiniteSequencer,
				events: getInitialInfiniteSequencerEvents(),
				name: 'Arp 2',
				infinityStyle: InfiniteSequencerStyle.colorBars,
			},
			target: {
				type: ConnectionNodeType.basicSynthesizer,
			},
		},
	})

	const serverStuff = createSourceAndTargets(serverStuffDefinitions)

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
	connectNodes(serverStuff.get('arp')!.source, serverStuff.get('arp2')!.target)

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
			makePosition({id: target.id, targetType: options.target.type})))

		const source = createSource({...options.source})
		dispatchToRoom(addPosition(
			makePosition({id: source.id, targetType: options.source.type, width: source.width, height: source.height})))

		connectNodes(source, target)

		connectNodes(target, masterAudioOutput)

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
		events?: SequencerEvents
		notesToShow?: number
	}

	function createSource(args: CreateSourceArgs) {
		switch (args.type) {
			case ConnectionNodeType.gridSequencer:
				const x = new GridSequencerState(args.name, args.notesToShow || 24, args.events)
				dispatchToRoom(addGridSequencer(x))
				// makeServerOwnedNode(args.type, x)
				return x
			case ConnectionNodeType.infiniteSequencer:
				const y = new InfiniteSequencerState(args.name, args.infinityStyle || InfiniteSequencerStyle.colorGrid, args.events)
				dispatchToRoom(addInfiniteSequencer(y))
				// makeServerOwnedNode(args.type, y)
				return y
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

function getBassNotes() {
	return createSequencerEvents(16)
		.map((_, i) => ({notes: MidiNotes(i % 2 === 1 ? [] : [24])}))
}

function getMelodyNotes() {
	return makeSequencerEvents([
		{notes: MidiNotes([36])},
		{notes: MidiNotes([40])},
		{notes: MidiNotes([43])},
		{notes: MidiNotes([47])},
		{notes: MidiNotes([48])},
		{notes: MidiNotes([47])},
		{notes: MidiNotes([43])},
		{notes: MidiNotes([40])},
		{notes: MidiNotes([36])},
		{notes: MidiNotes([40])},
		{notes: MidiNotes([43])},
		{notes: MidiNotes([47])},
		{notes: MidiNotes([48])},
		{notes: MidiNotes([47])},
		{notes: MidiNotes([43])},
		{notes: MidiNotes([40])},
		{notes: MidiNotes([36])},
		{notes: MidiNotes([40])},
		{notes: MidiNotes([43])},
		{notes: MidiNotes([47])},
		{notes: MidiNotes([48])},
		{notes: MidiNotes([47])},
		{notes: MidiNotes([43])},
		{notes: MidiNotes([40])},
		{notes: MidiNotes([36])},
		{notes: MidiNotes([40])},
		{notes: MidiNotes([43])},
		{notes: MidiNotes([47])},
		{notes: MidiNotes([48])},
		{notes: MidiNotes([47])},
		{notes: MidiNotes([43])},
		{notes: MidiNotes([40])},
	])
}

function getInitialInfiniteSequencerEvents() {
	return makeSequencerEvents([
		{notes: MidiNotes([60])},
		{notes: MidiNotes([64])},
		{notes: MidiNotes([67])},
		{notes: MidiNotes([71])},
		{notes: MidiNotes([72])},
		{notes: MidiNotes([71])},
		{notes: MidiNotes([67])},
		{notes: MidiNotes([64])},
	])
}
