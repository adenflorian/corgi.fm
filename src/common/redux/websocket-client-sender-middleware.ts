import {AnyAction, Dispatch, Middleware} from 'redux'
import {socket} from '../../client/websocket-listeners'
import {WebSocketEvent} from '../../common/server-constants'
import {IAppState} from './configureStore'
import {selectLocalSocketId} from './websocket-redux'

export interface BroadcastAction extends AnyAction {
	shouldBroadcast: boolean
	alreadyBroadcasted: boolean
	dispatchOnServer: boolean
}

export const websocketSenderMiddleware: Middleware = ({getState}) => next => (action: AnyAction | BroadcastAction) => {
	if (isNetworkAction(action) && !action.alreadyBroadcasted) {
		return processNetworkAction(action as BroadcastAction, getState, next)
	} else {
		return next(action)
	}
}

function isNetworkAction(action: AnyAction | BroadcastAction) {
	return action.shouldBroadcast || action.dispatchOnServer
}

function processNetworkAction(action: BroadcastAction, getState, next: Dispatch) {
	const state: IAppState = getState()
	const socketId = selectLocalSocketId(state)

	action.source = socketId

	if (action.shouldBroadcast) {
		socket.emit(WebSocketEvent.broadcast, action)
	} else if (action.dispatchOnServer) {
		socket.emit(WebSocketEvent.serverAction, action)
	} else {
		throw new Error('invalid network action: ' + JSON.stringify(action, null, 2))
	}

	return next(action)
}
