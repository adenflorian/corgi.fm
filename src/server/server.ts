import * as express from 'express'
import * as http from 'http'
import {Dispatch, Store} from 'redux'
import * as socketIO from 'socket.io'
import {logger} from '../common/logger'
import {addBasicInstrument, BasicInstrumentState} from '../common/redux/basic-instruments-redux'
import {addClient, ClientState} from '../common/redux/clients-redux'
import {addConnection, Connection, ConnectionSourceType, ConnectionTargetType} from '../common/redux/connections-redux'
import {addTrack, TrackState} from '../common/redux/tracks-redux'
// import {addVirtualKeyboard, VirtualKeyboardState} from '../common/redux/virtual-keyboard-redux'
import {configureServerStore} from './configure-server-store'
import {setupServerWebSocketListeners} from './server-socket-listeners'
import {setupExpressApp} from './setup-express-app'

const store: Store = configureServerStore()

createServerStuff(store.dispatch)

const app: express.Application = express()
const server: http.Server = new http.Server(app)
const io: socketIO.Server = socketIO(server)

setupExpressApp(app, store)

setupServerWebSocketListeners(io, store)

const port = 80

server.listen(port)

logger.log('shamu server listening on port', port)

function createServerStuff(dispatch: Dispatch) {
	const serverClient = ClientState.createServerClient()
	const addClientAction = addClient(serverClient)
	store.dispatch(addClientAction)

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
