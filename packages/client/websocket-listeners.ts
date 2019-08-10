import {Store} from 'redux'
// eslint-disable-next-line import/no-extraneous-dependencies
import * as io from 'socket.io-client'
import {maxRoomNameLength} from '@corgifm/common/common-constants'
import {logger} from '@corgifm/common/logger'
import {
	BroadcastAction, clientInfoActions, getActionsBlacklist, maxUsernameLength,
	selectActiveRoom, selfDisconnected, setInfo, setSocketId,
} from '@corgifm/common/redux'
import {WebSocketEvent} from '@corgifm/common/server-constants'
import {eventClientServerVersionMismatch} from './analytics/analytics'
import {getCurrentClientVersion} from './client-utils'
import {isLocalDevClient} from './is-prod-client'
import {getUsernameFromLocalStorage} from './username'

const port = isLocalDevClient() ? 3000 : 443

// TODO
// eslint-disable-next-line import/no-mutable-exports
export let socket: SocketIOClient.Socket

const refreshedToGetNewVersionKey = 'refreshedToGetNewVersion'

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
			logger.log(`client server version mismatch! client is ${clientVersion}, server is ${serverVersion}`)

			eventClientServerVersionMismatch(clientVersion, serverVersion)

			const refreshedToGetNewVersion = !!window.localStorage.getItem(refreshedToGetNewVersionKey)

			if (refreshedToGetNewVersion) {
				window.localStorage.removeItem(refreshedToGetNewVersionKey)
				logger.error(`refreshedToGetNewVersion but still version mismatch! `, {clientVersion, serverVersion})
			} else {
				window.localStorage.setItem(refreshedToGetNewVersionKey, 'true')
				window.location.reload(true)
			}
		} else {
			window.localStorage.removeItem(refreshedToGetNewVersionKey)
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

	function setupDefaultListeners(events: ([string, string] | [string])[]) {
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
