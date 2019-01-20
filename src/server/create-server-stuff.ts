import {Store} from 'redux'
import {addBasicInstrument, BasicInstrumentState} from '../common/redux/basic-instruments-redux'
import {addBasicSampler, BasicSamplerState} from '../common/redux/basic-sampler-redux'
import {addClient, ClientState} from '../common/redux/clients-redux'
import {IServerState} from '../common/redux/configure-server-store'
import {
	addConnection, Connection, ConnectionNodeType, IConnection,
	MASTER_AUDIO_OUTPUT_TARGET_ID, MASTER_CLOCK_SOURCE_ID, selectConnectionsWithTargetIds,
} from '../common/redux/connections-redux'
import {addGridSequencer, GridSequencerState} from '../common/redux/grid-sequencers-redux'
import {
	addInfiniteSequencer, InfiniteSequencerState, InfiniteSequencerStyle,
} from '../common/redux/infinite-sequencers-redux'
import {
	addPosition, Position, selectAllPositions, updatePositions,
} from '../common/redux/positions-redux'
import {createRoomAction} from '../common/redux/room-stores-redux'
import {createSequencerEvents} from '../common/redux/sequencer-redux'

export function createServerStuff(room: string, serverStore: Store<IServerState>) {
	const serverClient = ClientState.createServerClient()
	const addClientAction = addClient(serverClient)
	serverStore.dispatch(createRoomAction(addClientAction, room))

	serverStore.dispatch(createRoomAction(addPosition(
		new Position(MASTER_CLOCK_SOURCE_ID, ConnectionNodeType.masterClock)), room))
	serverStore.dispatch(createRoomAction(addPosition(
		new Position(MASTER_AUDIO_OUTPUT_TARGET_ID, ConnectionNodeType.audioOutput)), room))

	createSourceAndTarget({
		source: {
			type: ConnectionNodeType.gridSequencer,
			events: getBassNotes(),
			name: 'bass',
			notesToShow: 12,
		},
		target: {
			type: ConnectionNodeType.sampler,
		},
	})

	createSourceAndTarget({
		source: {
			type: ConnectionNodeType.gridSequencer,
			events: getMelodyNotes(),
			name: 'melody',
			notesToShow: 24,
		},
		target: {
			type: ConnectionNodeType.instrument,
		},
	})

	createSourceAndTarget({
		source: {
			type: ConnectionNodeType.infiniteSequencer,
			events: getInitialInfiniteSequencerEvents(),
			name: 'arp',
			infinityStyle: InfiniteSequencerStyle.colorGrid,
		},
		target: {
			type: ConnectionNodeType.sampler,
		},
	})

	createSourceAndTarget({
		source: {
			type: ConnectionNodeType.infiniteSequencer,
			events: getInitialInfiniteSequencerEvents(),
			name: 'arp2',
			infinityStyle: InfiniteSequencerStyle.colorBars,
		},
		target: {
			type: ConnectionNodeType.instrument,
		},
	})

	// Calculate positions
	const roomState = serverStore.getState().roomStores.get(room)!
	const originalPositions = selectAllPositions(roomState)

	const connectionsToMasterAudioOutput = selectConnectionsWithTargetIds(roomState, [MASTER_AUDIO_OUTPUT_TARGET_ID])

	const newPositions = originalPositions.withMutations(mutablePositions => {
		const rightMost = 600
		const topMost = -600
		const xSpacing = 700
		const ySpacing = 256

		mutablePositions.update(MASTER_AUDIO_OUTPUT_TARGET_ID,
			x => ({...x, x: rightMost, y: 0}),
		)

		const foo = (x: number, prevY: number) => (connection: IConnection, i: number) => {
			mutablePositions.update(connection.sourceId,
				z => ({...z, x: rightMost - (xSpacing * x), y: topMost + (i * ySpacing) + (prevY * ySpacing)}),
			)
			selectConnectionsWithTargetIds(roomState, [connection.sourceId]).forEach(foo(x + 1, i))
		}

		connectionsToMasterAudioOutput.forEach(foo(1, 0))
	})

	{
		let leftMost = 0
		let rightMost = 0

		newPositions.forEach(x => {
			if (x.x < leftMost) leftMost = x.x
			if (x.x + x.width > rightMost) rightMost = x.x + x.width
		})

		const adjustX = -(leftMost + rightMost) / 2
		// console.log('leftMost: ', leftMost)
		// console.log('rightMost: ', rightMost)
		// console.log('adjustX: ', adjustX)
		const adjustedPosition = newPositions.map(x => ({...x, x: x.x + adjustX}))

		serverStore.dispatch(createRoomAction(updatePositions(adjustedPosition), room))
	}

	interface CreateSourceAndTargetArgs {
		source: CreateSourceArgs
		target: {
			type: ConnectionNodeType,
		}
	}

	function createSourceAndTarget(options: CreateSourceAndTargetArgs) {
		const target = createTarget(options.target.type)
		serverStore.dispatch(createRoomAction(addPosition(
			new Position(target.id, options.target.type)), room))

		const source = createSource({...options.source})
		serverStore.dispatch(createRoomAction(addPosition(
			new Position(source.id, options.source.type, source.width, source.height)), room))

		// Source to target
		serverStore.dispatch(createRoomAction(addConnection(new Connection(
			source.id,
			options.source.type,
			target.id,
			options.target.type,
		)), room))

		// Target to audio output
		serverStore.dispatch(createRoomAction(addConnection(new Connection(
			target.id,
			options.target.type,
			MASTER_AUDIO_OUTPUT_TARGET_ID,
			ConnectionNodeType.audioOutput,
		)), room))

		// Master clock to source
		serverStore.dispatch(createRoomAction(addConnection(new Connection(
			MASTER_CLOCK_SOURCE_ID,
			ConnectionNodeType.masterClock,
			source.id,
			options.source.type,
		)), room))
	}

	interface CreateSourceArgs {
		type: ConnectionNodeType
		name: string
		infinityStyle?: InfiniteSequencerStyle
		events?: any
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
			case ConnectionNodeType.instrument:
				const x = new BasicInstrumentState(serverClient.id)
				serverStore.dispatch(createRoomAction(addBasicInstrument(x), room))
				return x
			case ConnectionNodeType.sampler:
				const y = new BasicSamplerState(serverClient.id)
				serverStore.dispatch(createRoomAction(addBasicSampler(y), room))
				return y
			default:
				throw new Error('Invalid type')
		}
	}
}

function getBassNotes() {
	return createSequencerEvents(16)
		.map((_, i) => ({notes: i % 2 === 1 ? [] : [24]}))
}

function getMelodyNotes() {
	return [
		{notes: [36]},
		{notes: [40]},
		{notes: [43]},
		{notes: [47]},
		{notes: [48]},
		{notes: [47]},
		{notes: [43]},
		{notes: [40]},
		{notes: [36]},
		{notes: [40]},
		{notes: [43]},
		{notes: [47]},
		{notes: [48]},
		{notes: [47]},
		{notes: [43]},
		{notes: [40]},
		{notes: [36]},
		{notes: [40]},
		{notes: [43]},
		{notes: [47]},
		{notes: [48]},
		{notes: [47]},
		{notes: [43]},
		{notes: [40]},
		{notes: [36]},
		{notes: [40]},
		{notes: [43]},
		{notes: [47]},
		{notes: [48]},
		{notes: [47]},
		{notes: [43]},
		{notes: [40]},
	]
}

function getInitialInfiniteSequencerEvents() {
	return [
		{notes: [60]},
		{notes: [64]},
		{notes: [67]},
		{notes: [71]},
		{notes: [72]},
		{notes: [71]},
		{notes: [67]},
		{notes: [64]},
	]
}
