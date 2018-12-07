import {Dispatch} from 'redux'
import {addBasicInstrument, BasicInstrumentState} from '../common/redux/basic-instruments-redux'
import {addClient, ClientState} from '../common/redux/clients-redux'
import {addConnection, Connection, ConnectionSourceType, ConnectionTargetType} from '../common/redux/connections-redux'
import {addTrack, TrackState} from '../common/redux/tracks-redux'

export function createServerStuff(dispatch: Dispatch) {
	const serverClient = ClientState.createServerClient()
	const addClientAction = addClient(serverClient)
	dispatch(addClientAction)

	const newInstrument = new BasicInstrumentState(serverClient.id)
	dispatch(addBasicInstrument(newInstrument))

	const serverTrack = new TrackState(getInitialTrackEvents())
	serverTrack.name = 'track 1'
	dispatch(addTrack(serverTrack))
	dispatch(addConnection(new Connection(
		serverTrack.id,
		ConnectionSourceType.track,
		newInstrument.id,
		ConnectionTargetType.instrument,
	)))

	// const newVirtualKeyboard = new VirtualKeyboardState(serverClient.id, serverClient.color)
	// dispatch(addVirtualKeyboard(newVirtualKeyboard))

	// dispatch(addConnection(new Connection(newVirtualKeyboard.id, newInstrument.id)))

	const newInstrument2 = new BasicInstrumentState(serverClient.id)
	dispatch(addBasicInstrument(newInstrument2))

	const serverTrack2 = new TrackState(getInitialTrackEvents2())
	serverTrack2.name = 'track 2'
	dispatch(addTrack(serverTrack2))
	dispatch(addConnection(new Connection(
		serverTrack2.id,
		ConnectionSourceType.track,
		newInstrument2.id,
		ConnectionTargetType.instrument,
	)))
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
