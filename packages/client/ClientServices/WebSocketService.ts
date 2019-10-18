import {Store} from 'redux'
import * as io from 'socket.io-client'
import {logger} from '@corgifm/common/logger'
import {
	BroadcastAction, clientInfoActions, getActionsBlacklist, maxUsernameLength,
	selectActiveRoom, commonActions, setInfo, setSocketId, BROADCASTER_ACTION,
} from '@corgifm/common/redux'
import {WebSocketEvent} from '@corgifm/common/server-constants'
import {roomNameCleaner} from '@corgifm/common/common-utils'
import {eventClientServerVersionMismatch} from '../analytics/analytics'
import {getCurrentClientVersion} from '../client-utils'
import {isLocalDevClient} from '../is-prod-client'
import {getUsernameFromLocalStorage} from '../username'

const port = isLocalDevClient() ? 3000 : 443

const refreshedToGetNewVersionKey = 'refreshedToGetNewVersion'

export class WebSocketService {
	private _socket!: SocketIOClient.Socket
	private _store!: Store

	public connect(store: Store) {
		this._store = store
		const room = roomNameCleaner(window.location.pathname)

		this._socket = io.connect(window.location.hostname + `:${port}/`, {
			// Make sure to add any new query params to the reconnect_attempt handler
			query: {
				username: getUsernameFromLocalStorage().substring(0, maxUsernameLength),
				room,
			},
		})

		this._socket.on('connect', () => {
			logger.log('socket: connect')
			this._store.dispatch(setSocketId(this._socket.id))
		})

		this._socket.on('reconnect_attempt', () => {
			this._socket.io.opts.query = {
				username: getUsernameFromLocalStorage().substring(0, maxUsernameLength),
				room: selectActiveRoom(this._store.getState()),
			}
		})

		this._socket.on('disconnect', () => {
			logger.log('socket: disconnect')
			this._store.dispatch(commonActions.selfDisconnected())
		})

		this._socket.on('version', (serverVersion: string) => {
			logger.log('received serverVersion:', serverVersion)

			const clientVersion = getCurrentClientVersion()

			this._store.dispatch(clientInfoActions.setServerVersion(serverVersion))

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

		this._socket.on(WebSocketEvent.broadcast, (action: BroadcastAction) => {
			if (getActionsBlacklist().includes(action.type) === false) {
				logger.trace('Received broadcast: ', action.type)
				logger.trace(action)
			}
			this._store.dispatch({...action, alreadyBroadcasted: true})
		})

		this._setupDefaultListeners([
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
	}

	public emit(event: WebSocketEvent.broadcast | WebSocketEvent.serverAction, actionToSend: WebSocketAction) {
		this._socket.emit(event, actionToSend)
	}

	private readonly _setupDefaultListeners = (events: ([string, string] | [string])[]) => {
		events.forEach(event => this._setupDefaultEventListener(event[0], event[1]))
	}

	private readonly _setupDefaultEventListener = (eventName: string, friendlyName?: string) => {
		this._socket.on(eventName, (data: any) => {
			this._socketInfo(`${friendlyName || eventName}: ` + JSON.stringify(data, null, 2))
		})
	}

	private readonly _socketInfo = (info: string) => {
		this._store.dispatch(setInfo(info))
		logger.trace(info)
	}

	public dispose() {
		this._socket.disconnect()
		delete this._socket
	}
}

interface WebSocketAction {
	readonly source: Id | undefined
	readonly alreadyBroadcasted: boolean
	readonly [BROADCASTER_ACTION]: any
	readonly type: any
}
