import * as express from 'express'
import * as http from 'http'
import * as socketIO from 'socket.io'
import {logger} from '../common/logger'
import {configureServerStore} from '../common/redux/configure-server-store'
import {createRoom} from '../common/redux/rooms-redux'
import {createServerStuff} from './create-server-stuff'
import {logServerEnv} from './is-prod-server'
import {lobby, setupServerWebSocketListeners} from './server-socket-listeners'
import {setupExpressApp} from './setup-express-app'

logServerEnv()

const serverStore = configureServerStore()

serverStore.dispatch(createRoom(lobby))

createServerStuff(lobby, serverStore)

const app: express.Application = express()
const server: http.Server = new http.Server(app)
const io: socketIO.Server = socketIO(server)

setupExpressApp(app, serverStore)

setupServerWebSocketListeners(io, serverStore)

const port = 3000

server.listen(port)

logger.log('shamu server listening on port ' + port)
