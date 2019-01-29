import {List, Map} from 'immutable'
import {Store} from 'redux'
import {ConnectionNodeType, IConnectable} from '../common/common-types'
import {MidiNotes} from '../common/MidiNote'
import {addBasicInstrument, addBasicSampler, addClient, addGridSequencer, addInfiniteSequencer, addPosition, BasicInstrumentState, BasicSamplerState, calculateExtremes, ClientState, Connection, connectionsActions, createRoomAction, createSequencerEvents, GridSequencerState, IConnection, InfiniteSequencerState, InfiniteSequencerStyle, ISequencerEvent, IServerState, makePosition, makeSequencerEvents, MASTER_AUDIO_OUTPUT_TARGET_ID, MASTER_CLOCK_SOURCE_ID, selectAllPositions, selectConnectionsWithTargetIds, SequencerEvents, updatePositions} from '../common/redux'

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

	serverStore.dispatch(createRoomAction(addClientAction, room))

	serverStore.dispatch(createRoomAction(addPosition(
		makePosition({id: MASTER_CLOCK_SOURCE_ID, targetType: ConnectionNodeType.masterClock})), room))

	serverStore.dispatch(createRoomAction(addPosition(
		makePosition({id: MASTER_AUDIO_OUTPUT_TARGET_ID, targetType: ConnectionNodeType.audioOutput})), room))

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
				type: ConnectionNodeType.basicInstrument,
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
				type: ConnectionNodeType.basicInstrument,
			},
		},
	})

	const serverStuff = createSourceAndTargets(serverStuffDefinitions)

	// Calculate positions
	const roomState = serverStore.getState().roomStores.get(room)!
	const originalPositions = selectAllPositions(roomState)

	const connectionsToMasterAudioOutput =
		selectConnectionsWithTargetIds(roomState, [MASTER_AUDIO_OUTPUT_TARGET_ID]).toList()

	const newPositions = originalPositions.withMutations(mutablePositions => {
		const xSpacing = 700
		const ySpacing = 256

		mutablePositions.update(MASTER_AUDIO_OUTPUT_TARGET_ID,
			x => ({...x, x: 0, y: 0}),
		)

		const foo = (x: number, prevY: number) => (connection: IConnection, i: number) => {
			mutablePositions.update(connection.sourceId,
				z => ({...z, x: -xSpacing * x, y: (i * ySpacing) + (prevY * ySpacing)}),
			)
			selectConnectionsWithTargetIds(roomState, [connection.sourceId])
				.toList()
				.forEach(foo(x + 1, i))
		}

		connectionsToMasterAudioOutput.forEach(foo(1, 0))
	})

	{
		const {leftMost, rightMost, topMost, bottomMost} = calculateExtremes(newPositions)

		const adjustX = -(leftMost + rightMost) / 2
		const adjustY = -(topMost + bottomMost) / 2

		const adjustedPosition = newPositions.map(x => ({...x, x: x.x + adjustX, y: x.y + adjustY}))

		serverStore.dispatch(createRoomAction(updatePositions(adjustedPosition), room))
	}

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
		serverStore.dispatch(createRoomAction(addPosition(
			makePosition({id: target.id, targetType: options.target.type})), room))

		const source = createSource({...options.source})
		serverStore.dispatch(createRoomAction(addPosition(
			makePosition({id: source.id, targetType: options.source.type, width: source.width, height: source.height})), room))

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
				serverStore.dispatch(createRoomAction(addGridSequencer(x), room))
				return x
			case ConnectionNodeType.infiniteSequencer:
				const y = new InfiniteSequencerState(args.name, args.infinityStyle || InfiniteSequencerStyle.colorGrid, args.events)
				serverStore.dispatch(createRoomAction(addInfiniteSequencer(y), room))
				return y
			default:
				throw new Error('Invalid type')
		}
	}

	function createTarget(type: ConnectionNodeType) {
		switch (type) {
			case ConnectionNodeType.basicInstrument:
				const x = new BasicInstrumentState(serverClient.id)
				serverStore.dispatch(createRoomAction(addBasicInstrument(x), room))
				return x
			case ConnectionNodeType.basicSampler:
				const y = new BasicSamplerState(serverClient.id)
				serverStore.dispatch(createRoomAction(addBasicSampler(y), room))
				return y
			default:
				throw new Error('Invalid type')
		}
	}

	function connectNodes(source: IConnectable, target: IConnectable) {
		serverStore.dispatch(createRoomAction(connectionsActions.add(new Connection(
			source.id,
			source.type,
			target.id,
			target.type,
		)), room))
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
