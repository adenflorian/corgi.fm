import {Store} from 'redux'
import {addBasicInstrument, BasicInstrumentState} from '../common/redux/basic-instruments-redux'
import {addClient, ClientState} from '../common/redux/clients-redux'
import {addConnection, Connection, ConnectionSourceType, ConnectionTargetType} from '../common/redux/connections-redux'
import {createRoomAction} from '../common/redux/room-stores-redux'
import {addTrack, TrackState} from '../common/redux/tracks-redux'

export function createServerStuff(room: string, serverStore: Store) {
	const serverClient = ClientState.createServerClient()
	const addClientAction = addClient(serverClient)
	serverStore.dispatch(createRoomAction(addClientAction, room))

	const newInstrument = new BasicInstrumentState(serverClient.id)
	serverStore.dispatch(createRoomAction(addBasicInstrument(newInstrument), room))

	const serverTrack = new TrackState('melody', getInitialTrackEvents())
	serverStore.dispatch(createRoomAction(addTrack(serverTrack), room))
	serverStore.dispatch(createRoomAction(addConnection(new Connection(
		serverTrack.id,
		ConnectionSourceType.track,
		newInstrument.id,
		ConnectionTargetType.instrument,
	)), room))

	// const newVirtualKeyboard = new VirtualKeyboardState(serverClient.id, serverClient.color)
	// serverStore.dispatch(createRoomAction(addVirtualKeyboard(newVirtualKeyboard))

	// serverStore.dispatch(createRoomAction(addConnection(new Connection(newVirtualKeyboard.id, newInstrument.id)))

	const newInstrument2 = new BasicInstrumentState(serverClient.id)
	serverStore.dispatch(createRoomAction(addBasicInstrument(newInstrument2), room))

	const serverTrack2 = new TrackState('bass', getInitialTrackEvents2())
	serverStore.dispatch(createRoomAction(addTrack(serverTrack2), room))
	serverStore.dispatch(createRoomAction(addConnection(new Connection(
		serverTrack2.id,
		ConnectionSourceType.track,
		newInstrument2.id,
		ConnectionTargetType.instrument,
	)), room))
}

function getInitialTrackEvents() {
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

function getInitialTrackEvents2() {
	return new Array(32).fill({notes: []})
}
