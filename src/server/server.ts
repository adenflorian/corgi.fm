import * as express from 'express'
import * as http from 'http'
import {Dispatch, Store} from 'redux'
import * as socketIO from 'socket.io'
import {logger} from '../common/logger'
import {addBasicInstrument, BasicInstrumentState} from '../common/redux/basic-instruments-redux'
import {addConnection, Connection} from '../common/redux/connections-redux'
import {setLocalVirtualKeyboardId} from '../common/redux/local-redux'
import {addVirtualKeyboard, VirtualKeyboardState} from '../common/redux/virtual-keyboard-redux'
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
	const track1Id = 'track-1'

	const newInstrument = new BasicInstrumentState(track1Id)
	dispatch(addBasicInstrument(newInstrument))

	const newVirtualKeyboard = new VirtualKeyboardState(track1Id, '#4077bf')
	dispatch(addVirtualKeyboard(newVirtualKeyboard))
	dispatch(setLocalVirtualKeyboardId(newVirtualKeyboard.id))

	dispatch(addConnection(new Connection(newVirtualKeyboard.id, newInstrument.id)))
}
