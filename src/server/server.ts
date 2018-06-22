import * as animal from 'animal-id'
import * as express from 'express'
import * as http from 'http'
import {Store} from 'redux'
import * as socketIO from 'socket.io'
import {logger} from '../common/logger'
import {configureServerStore} from './configure-server-store'
import {setupServerWebSocketListeners} from './server-socket-listeners'
import {setupExpressApp} from './setup-express-app'

const store: Store = configureServerStore()

const app: express.Application = express()
const server: http.Server = new http.Server(app)
const io: socketIO.Server = socketIO(server)

setupExpressApp(app, store)

setupServerWebSocketListeners(io, store)

let nextId = 1

const engine: any = io.engine

engine.generateId = () => {
	return animal.getId() + '-' + nextId++
}

const port = 80

server.listen(port)

logger.log('shamu server listening on port', port)
