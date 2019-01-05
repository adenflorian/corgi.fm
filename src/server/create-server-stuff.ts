import {Store} from 'redux'
import {addBasicInstrument, BasicInstrumentState} from '../common/redux/basic-instruments-redux'
import {addClient, ClientState} from '../common/redux/clients-redux'
import {addConnection, Connection, ConnectionSourceType, ConnectionTargetType} from '../common/redux/connections-redux'
import {addGridSequencer, GridSequencerState} from '../common/redux/grid-sequencers-redux'
import {createRoomAction} from '../common/redux/room-stores-redux'

export function createServerStuff(room: string, serverStore: Store) {
	const serverClient = ClientState.createServerClient()
	const addClientAction = addClient(serverClient)
	serverStore.dispatch(createRoomAction(addClientAction, room))

	const newInstrument = new BasicInstrumentState(serverClient.id)
	serverStore.dispatch(createRoomAction(addBasicInstrument(newInstrument), room))

	const serverGridSequencer = new GridSequencerState('melody', getInitialGridSequencerEvents())
	serverStore.dispatch(createRoomAction(addGridSequencer(serverGridSequencer), room))
	serverStore.dispatch(createRoomAction(addConnection(new Connection(
		serverGridSequencer.id,
		ConnectionSourceType.gridSequencer,
		newInstrument.id,
		ConnectionTargetType.instrument,
	)), room))

	// const newVirtualKeyboard = new VirtualKeyboardState(serverClient.id, serverClient.color)
	// serverStore.dispatch(createRoomAction(addVirtualKeyboard(newVirtualKeyboard))

	// serverStore.dispatch(createRoomAction(addConnection(new Connection(newVirtualKeyboard.id, newInstrument.id)))

	const newInstrument2 = new BasicInstrumentState(serverClient.id)
	serverStore.dispatch(createRoomAction(addBasicInstrument(newInstrument2), room))

	const serverGridSequencer2 = new GridSequencerState('bass', getInitialGridSequencerEvents2())
	serverStore.dispatch(createRoomAction(addGridSequencer(serverGridSequencer2), room))
	serverStore.dispatch(createRoomAction(addConnection(new Connection(
		serverGridSequencer2.id,
		ConnectionSourceType.gridSequencer,
		newInstrument2.id,
		ConnectionTargetType.instrument,
	)), room))

	// const newInstrument3 = new BasicSamplerState(serverClient.id)
	// serverStore.dispatch(createRoomAction(addBasicSampler(newInstrument3), room))

	// const serverGridSequencer3 = new GridSequencerState('bass', getInitialGridSequencerEvents2())
	// serverStore.dispatch(createRoomAction(addGridSequencer(serverGridSequencer3), room))
	// serverStore.dispatch(createRoomAction(addConnection(new Connection(
	// 	serverGridSequencer3.id,
	// 	ConnectionSourceType.gridSequencer,
	// 	newInstrument3.id,
	// 	ConnectionTargetType.instrument,
	// )), room))
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
