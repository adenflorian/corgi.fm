import {AnyAction} from 'redux'
import {WebSocketEvent} from '../../common/server-constants'
import {CLIENT_DISCONNECTED, clientDisconnecting, selectLocalClient} from './clients-redux'
import {IAppState} from './configureStore'
import {
	selectKeyboardPressedKeysByOwner,
	VIRTUAL_KEY_PRESSED,
	VIRTUAL_KEY_UP,
	VirtualKeyAction,
} from './virtual-keyboard-redux'

export interface ShamuAction extends AnyAction {
	shouldBroadcast?: boolean
	alreadyBroadcasted?: boolean
	dispatchOnServer?: boolean
}

export interface BroadcastAction extends AnyAction {
	shouldBroadcast: boolean
	alreadyBroadcasted: boolean
	dispatchOnServer: boolean
}

export const websocketSenderMiddleware = store => next => (action: ShamuAction) => {
	const state: IAppState = store.getState()
	const socket = state.websocket.socket

	action.source = socket && socket.id

	if (action.shouldBroadcast && !action.alreadyBroadcasted) {
		socket.emit(WebSocketEvent.broadcast, action)
		return next(action)
	} else if (action.dispatchOnServer && !action.alreadyBroadcasted) {
		socket.emit(WebSocketEvent.serverAction, action)
		return next(action)
	}

	switch (action.type) {
		case VIRTUAL_KEY_PRESSED:
		case VIRTUAL_KEY_UP:
			return onVirtualKey(action as VirtualKeyAction, store, next, socket, selectLocalClient(state))
		case CLIENT_DISCONNECTED:
			store.dispatch(clientDisconnecting(action.id))

			setTimeout(() => {
				next(action)
			}, 2000)
			return next(action)
		default:
			return next(action)
	}
}

function onVirtualKey(action: VirtualKeyAction, store, next, socket, myClientId) {
	next(action)
	if (action.ownerId === myClientId.id) {
		const state: IAppState = store.getState()
		socket.emit('notes', {notes: selectKeyboardPressedKeysByOwner(state, action.ownerId)})
	}
}
