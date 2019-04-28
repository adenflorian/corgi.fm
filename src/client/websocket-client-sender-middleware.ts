import {Map} from 'immutable'
import {AnyAction, Dispatch, Middleware} from 'redux'
import {rateLimitedDebounce} from '../common/common-utils'
import {logger} from '../common/logger'
import {
	BroadcastAction, BROADCASTER_ACTION, getActionsBlacklist,
	GLOBAL_SERVER_ACTION, IClientAppState,
	MOVE_POSITION, selectLocalSocketId, SERVER_ACTION, UPDATE_POINTER,
} from '../common/redux'
import {WebSocketEvent} from '../common/server-constants'
import {socket} from './websocket-listeners'

export const websocketSenderMiddleware: Middleware<{}, IClientAppState, Dispatch> =
	({getState}) => next => (action: AnyAction | BroadcastAction) => {
		next(action)

		if (isNetworkAction(action) && !action.alreadyBroadcasted) {
			const bar = rateLimitedActionThings.get(action.type)
			if (bar) {
				bar(action as BroadcastAction, getState)
			} else {
				return processNetworkAction(action as BroadcastAction, getState)
			}
		}
	}

function isNetworkAction(action: AnyAction | BroadcastAction) {
	return action[BROADCASTER_ACTION] || action[SERVER_ACTION]
}

const processNetworkAction = (action: BroadcastAction, getState: () => IClientAppState) => {
	action.source = selectLocalSocketId(getState())

	if (getActionsBlacklist().includes(action.type) === false) {
		logger.trace('sending action to server: ', action)
	}

	const event = determineEvent(action)

	socket.emit(event, action)
}

function determineEvent(action: BroadcastAction) {
	if (action[BROADCASTER_ACTION]) {
		return WebSocketEvent.broadcast
	} else if (action[SERVER_ACTION] || action[GLOBAL_SERVER_ACTION]) {
		return WebSocketEvent.serverAction
	} else {
		throw new Error('invalid network action: ' + JSON.stringify(action, null, 2))
	}
}

const actionTypeRateLimitIntervals = Map<string, number>([
	[UPDATE_POINTER, 50],
	[MOVE_POSITION, 100],
])

const rateLimitedActionThings = actionTypeRateLimitIntervals
	.map(intervalMs => {
		return rateLimitedDebounce(
			processNetworkAction,
			intervalMs,
		)
	})
