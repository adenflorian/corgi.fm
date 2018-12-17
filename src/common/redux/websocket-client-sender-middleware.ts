import {AnyAction, Dispatch, Middleware, MiddlewareAPI, Store} from 'redux'
import {socket} from '../../client/websocket-listeners'
import {WebSocketEvent} from '../../common/server-constants'
import {logger} from '../logger'
import {SET_CLIENT_POINTER} from './clients-redux'
import {IClientAppState} from './common-redux-types'
import {BROADCASTER_ACTION, SERVER_ACTION} from './redux-utils'
import {selectLocalSocketId} from './websocket-redux'

export interface BroadcastAction extends AnyAction {
	alreadyBroadcasted: boolean
	[BROADCASTER_ACTION]: any
}

export const websocketSenderMiddleware: Middleware<{}, IClientAppState, Dispatch> =
	({getState}) => next => (action: AnyAction | BroadcastAction) => {
		if (isNetworkAction(action) && !action.alreadyBroadcasted) {
			return processNetworkAction(action as BroadcastAction, getState, next)
		} else {
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
		logger.debug('sending action to server: ', action)
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
