import * as express from 'express'
import * as http from 'http'
import * as socketIO from 'socket.io'
import {serverClientId} from '../common/common-constants'
import {logger} from '../common/logger'
import {configureServerStore, createRoomAction, roomSettingsActions} from '../common/redux'
import {createRoom} from '../common/redux'
import {createServerStuff} from './create-server-stuff'
import {connectDB, DBStore} from './database/database'
import {logServerEnv} from './is-prod-server'
import {startRoomWatcher} from './room-watcher'
import {lobby, setupServerWebSocketListeners} from './server-socket-listeners'
import {setupExpressApp} from './setup-express-app'

start()

async function start() {

	logServerEnv()

	const dbStore: DBStore = await connectDB()

	const serverStore = configureServerStore()

	serverStore.dispatch(createRoom(lobby, Date.now()))
	serverStore.dispatch(createRoomAction(roomSettingsActions.setOwner(serverClientId), lobby))

	createServerStuff(lobby, serverStore)

	const app = setupExpressApp(serverStore)

	const server: http.Server = new http.Server(app)
	const io: socketIO.Server = socketIO(server)

	setupServerWebSocketListeners(io, serverStore, dbStore)

	startRoomWatcher(io, serverStore)

	const port = 3000

	server.listen(port)

	logger.log('corgi.fm server listening on port ' + port)
}
