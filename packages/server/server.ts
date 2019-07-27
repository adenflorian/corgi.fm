import * as http from 'http'
import * as socketIO from 'socket.io'
import {lobby, serverClientId} from '@corgifm/common/common-constants'
import {logger} from '@corgifm/common/logger'
import {
	configureServerStore, createRoomAction, roomSettingsActions, createRoom,
} from '@corgifm/common/redux'
import {initSentryServer} from './analytics/sentry-server'
import {createServerStuff} from './create-server-stuff'
import {connectDB, DBStore} from './database/database'
import {getServerEnv, isLocalDevServer, logServerEnv} from './is-prod-server'
import {startRoomWatcher} from './room-watcher'
import {setupServerWebSocketListeners} from './server-socket-listeners'
import {setupExpressApp} from './setup-express-app'

if (!isLocalDevServer()) initSentryServer()

logger.log('CORGI_ENV: ', process.env.CORGI_ENV)
logger.log('NODE_ENV: ', process.env.NODE_ENV)
logger.log('getServerEnv: ', getServerEnv())

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start()

async function start() {
	logServerEnv()

	let dbStore: DBStore

	try {
		dbStore = await connectDB()
	} catch (error) {
		logger.error('failed to connect to database! ', error)
		throw error
	}

	const serverStore = configureServerStore()

	serverStore.dispatch(createRoom(lobby, Date.now()))
	serverStore.dispatch(createRoomAction(roomSettingsActions.setOwner(serverClientId), lobby))

	createServerStuff(lobby, serverStore)

	const app = await setupExpressApp(serverStore, dbStore)

	const server: http.Server = new http.Server(app.callback())
	const io: socketIO.Server = socketIO(server)

	setupServerWebSocketListeners(io, serverStore, dbStore)

	startRoomWatcher(io, serverStore)

	const port = 3000

	server.listen(port)

	logger.log(`corgi.fm server listening on port ${port}`)
}
