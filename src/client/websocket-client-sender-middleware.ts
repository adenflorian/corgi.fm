import {AnyAction, Dispatch, Middleware} from 'redux'
import {logger} from '../common/logger'
import {BroadcastAction} from '../common/redux'
import {BROADCASTER_ACTION, IClientAppState, selectLocalSocketId, SERVER_ACTION, SET_CLIENT_POINTER} from '../common/redux'
import {WebSocketEvent} from '../common/server-constants'
import {socket} from './websocket-listeners'

export const websocketSenderMiddleware: Middleware<{}, IClientAppState, Dispatch> =
	({getState}) => next => (action: AnyAction | BroadcastAction) => {
		if (isNetworkAction(action) && !action.alreadyBroadcasted) {
			return processNetworkAction(action as BroadcastAction, getState, next)
		} else {
			// console.log('websocketSenderMiddleware: ', action.type)
			return next(action)
		}
	}

function isNetworkAction(action: AnyAction | BroadcastAction) {
	return action[BROADCASTER_ACTION] || action[SERVER_ACTION]
}

function processNetworkAction(action: BroadcastAction, getState: () => IClientAppState, next: Dispatch) {
	const state = getState()
	const socketId = selectLocalSocketId(state)

	action.source = socketId

	if (action.type !== SET_CLIENT_POINTER) {
		logger.trace('sending action to server: ', action)
	}

	if (action[BROADCASTER_ACTION]) {
		socket.emit(WebSocketEvent.broadcast, action)
	} else if (action[SERVER_ACTION]) {
		socket.emit(WebSocketEvent.serverAction, action)
	} else {
		throw new Error('invalid network action: ' + JSON.stringify(action, null, 2))
	}

	return next(action)
}
