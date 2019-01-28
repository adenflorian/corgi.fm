import {Map} from 'immutable'
import {Store} from 'redux'
import {ConnectionNodeType} from '../common/common-types'
import {addBasicInstrument, BasicInstrumentState} from '../common/redux/basic-instruments-redux'
import {addBasicSampler, BasicSamplerState} from '../common/redux/basic-sampler-redux'
import {addClient, ClientState} from '../common/redux/clients-redux'
import {IServerState} from '../common/redux/configure-server-store'
import {
	Connection, connectionsActions, IConnection, selectConnectionsWithTargetIds,
} from '../common/redux/connections-redux'
import {addGridSequencer, GridSequencerState} from '../common/redux/grid-sequencers-redux'
import {
	addInfiniteSequencer, InfiniteSequencerState, InfiniteSequencerStyle,
} from '../common/redux/infinite-sequencers-redux'
import {MASTER_AUDIO_OUTPUT_TARGET_ID, MASTER_CLOCK_SOURCE_ID} from '../common/redux/node-types'
import {
	addPosition, calculateExtremes, makePosition, selectAllPositions, updatePositions,
} from '../common/redux/positions-redux'
import {createRoomAction} from '../common/redux/room-stores-redux'
import {createSequencerEvents} from '../common/redux/sequencer-redux'

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
				type: ConnectionNodeType.sampler,
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
				type: ConnectionNodeType.instrument,
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
				type: ConnectionNodeType.sampler,
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
				type: ConnectionNodeType.instrument,
			},
		},
	})

	createSourceAndTargets(serverStuffDefinitions)

	function createSourceAndTargets(defs: typeof serverStuffDefinitions) {
		return Map(defs).map(createSourceAndTarget)
	}

	// Calculate positions
	const roomState = serverStore.getState().roomStores.get(room)!
	const originalPositions = selectAllPositions(roomState)

	const connectionsToMasterAudioOutput = selectConnectionsWithTargetIds(roomState, [MASTER_AUDIO_OUTPUT_TARGET_ID])

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
			selectConnectionsWithTargetIds(roomState, [connection.sourceId]).forEach(foo(x + 1, i))
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

	interface CreateSourceAndTargetArgs {
		source: CreateSourceArgs
		target: {
			type: ConnectionNodeType,
		}
	}

	function createSourceAndTarget(options: CreateSourceAndTargetArgs) {
		const target = createTarget(options.target.type)
		serverStore.dispatch(createRoomAction(addPosition(
			makePosition({id: target.id, targetType: options.target.type})), room))

		const source = createSource({...options.source})
		serverStore.dispatch(createRoomAction(addPosition(
			makePosition({id: source.id, targetType: options.source.type, width: source.width, height: source.height})), room))

		// Source to target
		serverStore.dispatch(createRoomAction(connectionsActions.add(new Connection(
			source.id,
			source.type,
			target.id,
			target.type,
		)), room))

		// Target to audio output
		serverStore.dispatch(createRoomAction(connectionsActions.add(new Connection(
			target.id,
			target.type,
			MASTER_AUDIO_OUTPUT_TARGET_ID,
			ConnectionNodeType.audioOutput,
		)), room))

		// Master clock to source
		serverStore.dispatch(createRoomAction(connectionsActions.add(new Connection(
			MASTER_CLOCK_SOURCE_ID,
			ConnectionNodeType.masterClock,
			source.id,
			source.type,
		)), room))

		return {
			source,
			target,
		}
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
