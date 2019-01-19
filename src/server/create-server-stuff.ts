import {Store} from 'redux'
import {addBasicInstrument, BasicInstrumentState} from '../common/redux/basic-instruments-redux'
import {addBasicSampler, BasicSamplerState} from '../common/redux/basic-sampler-redux'
import {addClient, ClientState} from '../common/redux/clients-redux'
import {
	addConnection, Connection, ConnectionNodeType, MASTER_AUDIO_OUTPUT_TARGET_ID, MASTER_CLOCK_SOURCE_ID,
} from '../common/redux/connections-redux'
import {addGridSequencer, GridSequencerState} from '../common/redux/grid-sequencers-redux'
import {
	addInfiniteSequencer, InfiniteSequencerState, InfiniteSequencerStyle,
} from '../common/redux/infinite-sequencers-redux'
import {addPosition, Position} from '../common/redux/positions-redux'
import {createRoomAction} from '../common/redux/room-stores-redux'
import {createSequencerEvents} from '../common/redux/sequencer-redux'

export function createServerStuff(room: string, serverStore: Store) {
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

	interface CreateSourceAndTargetArgs {
		source: CreateSourceArgs
		target: {
			type: ConnectionNodeType,
		}
	}

	function createSourceAndTarget(options: CreateSourceAndTargetArgs) {
		const target = createTarget(options.target.type)
		serverStore.dispatch(createRoomAction(addPosition(new Position(target.id, options.target.type)), room))

		const source = createSource({
			...options.source,
		})
		serverStore.dispatch(createRoomAction(addPosition(new Position(source.id, options.source.type)), room))

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

	function createTarget(type: ConnectionNodeType): any {
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
