import {Store} from 'redux'
import {addBasicInstrument, BasicInstrumentState} from '../common/redux/basic-instruments-redux'
import {addBasicSampler, BasicSamplerState} from '../common/redux/basic-sampler-redux'
import {addClient, ClientState} from '../common/redux/clients-redux'
import {addConnection, Connection, ConnectionSourceType, ConnectionTargetType} from '../common/redux/connections-redux'
import {addGridSequencer, GridSequencerState} from '../common/redux/grid-sequencers-redux'
import {
	addInfiniteSequencer, InfiniteSequencerState, InfiniteSequencerStyle,
} from '../common/redux/infinite-sequencers-redux'
import {createRoomAction} from '../common/redux/room-stores-redux'

export function createServerStuff(room: string, serverStore: Store) {
	const serverClient = ClientState.createServerClient()
	const addClientAction = addClient(serverClient)
	serverStore.dispatch(createRoomAction(addClientAction, room))

	createSourceAndTarget({
		source: {
			type: ConnectionSourceType.gridSequencer,
			events: getInitialGridSequencerEvents(),
			name: 'melody',
		},
		target: {
			type: ConnectionTargetType.sampler,
		},
	})

	createSourceAndTarget({
		source: {
			type: ConnectionSourceType.gridSequencer,
			events: getInitialGridSequencerEvents2(),
			name: 'bass',
		},
		target: {
			type: ConnectionTargetType.instrument,
		},
	})

	createSourceAndTarget({
		source: {
			type: ConnectionSourceType.infiniteSequencer,
			events: getInitialInfiniteSequencerEvents(),
			name: 'arp',
			infinityStyle: InfiniteSequencerStyle.colorGrid,
		},
		target: {
			type: ConnectionTargetType.sampler,
		},
	})

	createSourceAndTarget({
		source: {
			type: ConnectionSourceType.infiniteSequencer,
			events: getInitialInfiniteSequencerEvents(),
			name: 'arp2',
			infinityStyle: InfiniteSequencerStyle.colorBars,
		},
		target: {
			type: ConnectionTargetType.instrument,
		},
	})

	interface CreateSourceAndTargetArgs {
		source: {
			type: ConnectionSourceType,
			events?: any,
			infinityStyle?: InfiniteSequencerStyle,
			name: string,
		},
		target: {
			type: ConnectionTargetType,
		},
	}

	function createSourceAndTarget(options: CreateSourceAndTargetArgs) {
		const target = createTarget(options.target.type)

		const source = createSource({
			...options.source,
		})

		serverStore.dispatch(createRoomAction(addConnection(new Connection(
			source.id,
			options.source.type,
			target.id,
			options.target.type,
		)), room))
	}

	interface CreateSourceArgs {
		type: ConnectionSourceType,
		name: string,
		infinityStyle?: InfiniteSequencerStyle,
		events?: any,
	}

	function createSource(args: CreateSourceArgs) {
		switch (args.type) {
			case ConnectionSourceType.gridSequencer:
				const x = new GridSequencerState(args.name, 36, args.events)
				serverStore.dispatch(createRoomAction(addGridSequencer(x), room))
				return x
			case ConnectionSourceType.infiniteSequencer:
				const y = new InfiniteSequencerState(args.name, args.infinityStyle || InfiniteSequencerStyle.colorGrid, args.events)
				serverStore.dispatch(createRoomAction(addInfiniteSequencer(y), room))
				return y
			default:
				throw new Error('Invalid type')
		}
	}

	function createTarget(type: ConnectionTargetType): any {
		switch (type) {
			case ConnectionTargetType.instrument:
				const x = new BasicInstrumentState(serverClient.id)
				serverStore.dispatch(createRoomAction(addBasicInstrument(x), room))
				return x
			case ConnectionTargetType.sampler:
				const y = new BasicSamplerState(serverClient.id)
				serverStore.dispatch(createRoomAction(addBasicSampler(y), room))
				return y
			default:
				throw new Error('Invalid type')
		}
	}
}

function getInitialGridSequencerEvents() {
	return [
		{notes: [49]},
		{notes: [63, 58]},
		{notes: [49]},
		{notes: []},
		{notes: [49, 58]},
		{notes: []},
		{notes: [49]},
		{notes: [58, 63]},
		{notes: [51]},
		{notes: []},
		{notes: [51, 58]},
		{notes: []},
		{notes: [51]},
		{notes: [58]},
		{notes: [66, 51]},
		{notes: []},
	]
}

function getInitialGridSequencerEvents2() {
	return new Array(32)
		.fill({notes: []})
		.map((_, i) => ({notes: i % 2 === 1 ? [] : [32]}))
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
