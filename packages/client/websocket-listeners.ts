import {Store} from 'redux'
import * as io from 'socket.io-client'
import {maxRoomNameLength} from '../common/common-constants'
import {logger} from '../common/logger'
import {
	BroadcastAction, clientInfoActions, getActionsBlacklist, maxUsernameLength,
	selectActiveRoom, selfDisconnected, setInfo, setSocketId,
} from '../common/redux'
import {WebSocketEvent} from '../common/server-constants'
import {eventClientServerVersionMismatch} from './analytics/analytics'
import {getCurrentClientVersion} from './client-utils'
import {isLocalDevClient} from './is-prod-client'
import {getUsernameFromLocalStorage} from './username'

const port = isLocalDevClient() ? 3000 : 443

export let socket: SocketIOClient.Socket

export function setupWebsocketAndListeners(store: Store) {

	const room = window.location.pathname
		.replace(/^\//, '')
		.replace(/%3F.*/, '')
		.replace(/\/.*/, '')
		.trim()
		.substring(0, maxRoomNameLength)

	socket = io.connect(window.location.hostname + `:${port}/`, {
		// Make sure to add any new query params to the reconnect_attempt handler
		query: {
			username: getUsernameFromLocalStorage().substring(0, maxUsernameLength),
			room,
		},
	})

	socket.on('connect', () => {
		logger.log('socket: connect')
		store.dispatch(setSocketId(socket.id))
	})

	socket.on('reconnect_attempt', () => {
		socket.io.opts.query = {
			username: getUsernameFromLocalStorage().substring(0, maxUsernameLength),
			room: selectActiveRoom(store.getState()),
		}
	})

	socket.on('disconnect', () => {
		logger.log('socket: disconnect')
		store.dispatch(selfDisconnected())
	})

	socket.on('version', (serverVersion: string) => {
		logger.log('received serverVersion:', serverVersion)

		const clientVersion = getCurrentClientVersion()

		store.dispatch(clientInfoActions.setServerVersion(serverVersion))

		if (serverVersion !== clientVersion) {
			logger.warn(`client server version mismatch! client is ${clientVersion}, server is ${serverVersion}`)

			eventClientServerVersionMismatch(clientVersion, serverVersion)
		}
	})

	socket.on(WebSocketEvent.broadcast, (action: BroadcastAction) => {
		if (getActionsBlacklist().includes(action.type) === false) {
			logger.trace('Received broadcast: ', action.type)
			logger.trace(action)
		}
		store.dispatch({...action, alreadyBroadcasted: true})
	})

	setupDefaultListeners([
		['connect'],
		['disconnect'],
		['reconnect_attempt'],
		['reconnecting'],
		['reconnect_error'],
		['reconnect_failed'],
		['ping'],
		['reconnect'],
		['connect_timeout'],
		['error'],
		['connect_error'],
		['pong', 'pong - latency'],
		['newClient'],
		['clientDisconnected'],
	])

	function setupDefaultListeners(events: Array<[string, string] | [string]>) {
		events.forEach(event => setupDefaultEventListener(event[0], event[1]))
	}

	function setupDefaultEventListener(eventName: string, friendlyName?: string) {
		socket.on(eventName, (data: any) => {
			socketInfo(`${friendlyName || eventName}: ` + JSON.stringify(data, null, 2))
		})
	}

	function socketInfo(info: string) {
		store.dispatch(setInfo(info))
		logger.trace(info)
	}
}
