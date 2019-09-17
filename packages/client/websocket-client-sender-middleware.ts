import {Map} from 'immutable'
import {AnyAction, Dispatch, Middleware} from 'redux'
import {rateLimitedDebounce} from '@corgifm/common/common-utils'
import {logger} from '@corgifm/common/logger'
import {
	BroadcastAction, BROADCASTER_ACTION, getActionsBlacklist,
	GLOBAL_SERVER_ACTION, IClientAppState,
	selectClientInfo, selectLocalSocketId, SERVER_ACTION,
} from '@corgifm/common/redux'
import {WebSocketEvent} from '@corgifm/common/server-constants'
import {socket} from './websocket-listeners'

export const websocketSenderMiddleware: Middleware<{}, IClientAppState, Dispatch> =
	({getState}) => next => function _websocketSenderMiddleware(action: AnyAction | BroadcastAction) {
		next(action)

		// Don't try to send stuff over network if we're not ready (disconnected/offline)
		if (!selectClientInfo(getState()).isClientReady) return

		if (isNetworkAction(action) && !action.alreadyBroadcasted) {
			const bar = rateLimitedActionThings.get(action.type)
			if (bar) {
				bar(action as BroadcastAction, getState)
			} else {
				return processNetworkAction(action as BroadcastAction, getState)
			}
		}
	}

function isNetworkAction(action: AnyAction | BroadcastAction): boolean {
	return action[BROADCASTER_ACTION] || action[SERVER_ACTION]
}

function processNetworkAction(action: BroadcastAction, getState: () => IClientAppState) {
	const actionToSend = {
		...action,
		source: selectLocalSocketId(getState()),
	}

	if (getActionsBlacklist().includes(actionToSend.type) === false) {
		logger.trace('sending action to server: ', actionToSend)
	}

	const event = determineEvent(actionToSend)

	socket.emit(event, actionToSend)
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
	// This is already debounced in input-event.ts
	// ['UPDATE_POINTER', 50],
	['MOVE_POSITION', 100],
])

const rateLimitedActionThings = actionTypeRateLimitIntervals
	.map(intervalMs => {
		return rateLimitedDebounce(
			processNetworkAction,
			intervalMs,
		)
	})
