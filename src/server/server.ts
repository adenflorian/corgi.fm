import * as express from 'express'
import * as http from 'http'
import * as socketIO from 'socket.io'
import {logger} from '../common/logger'
import {selectRoomStoreByName} from '../common/redux/room-stores-redux'
import {createRoom} from '../common/redux/rooms-redux'
import {configureServerStore} from './configure-server-store'
import {createServerStuff} from './create-server-stuff'
import {lobby, setupServerWebSocketListeners} from './server-socket-listeners'
import {setupExpressApp} from './setup-express-app'

const serverStore = configureServerStore()

serverStore.dispatch(createRoom(lobby))

createServerStuff(selectRoomStoreByName(serverStore.getState(), lobby).dispatch)

const app: express.Application = express()
const server: http.Server = new http.Server(app)
const io: socketIO.Server = socketIO(server)

setupExpressApp(app, serverStore)

setupServerWebSocketListeners(io, serverStore)

const port = 80

server.listen(port)

logger.log('shamu server listening on port', port)
