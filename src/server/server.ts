import * as http from 'http'
import * as socketIO from 'socket.io'
import {serverClientId} from '../common/common-constants'
import {logger} from '../common/logger'
import {configureServerStore, createRoomAction, roomSettingsActions} from '../common/redux'
import {createRoom} from '../common/redux'
import {initSentryServer} from './analytics/sentry-server'
import {createServerStuff} from './create-server-stuff'
import {connectDB, DBStore, dummyDb} from './database/database'
import {getServerEnv, logServerEnv} from './is-prod-server'
import {startRoomWatcher} from './room-watcher'
import {lobby, setupServerWebSocketListeners} from './server-socket-listeners'
import {setupExpressApp} from './setup-express-app'

initSentryServer()

logger.log('CORGI_ENV: ', process.env.CORGI_ENV)
logger.log('NODE_ENV: ', process.env.NODE_ENV)
logger.log('getServerEnv: ', getServerEnv())

// tslint:disable-next-line: no-floating-promises
start()

async function start() {

	logServerEnv()

	let dbStore: DBStore = dummyDb

	try {
		dbStore = await connectDB()
	} catch (e) {
		logger.warn('failed to connect to database! ', e)
	}

	const serverStore = configureServerStore()

	serverStore.dispatch(createRoom(lobby, Date.now()))
	serverStore.dispatch(createRoomAction(roomSettingsActions.setOwner(serverClientId), lobby))

	createServerStuff(lobby, serverStore)

	const app = await setupExpressApp(serverStore, dbStore)

	const server: http.Server = new http.Server(app)
	const io: socketIO.Server = socketIO(server)

	setupServerWebSocketListeners(io, serverStore, dbStore)

	startRoomWatcher(io, serverStore)

	const port = 3000

	server.listen(port)

	logger.log('corgi.fm server listening on port ' + port)
}
