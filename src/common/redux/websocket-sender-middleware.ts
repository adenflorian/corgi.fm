import {AnyAction} from 'redux'
import {WebSocketEvent} from '../../common/server-constants'
import {CLIENT_DISCONNECTED, clientDisconnecting, selectOwner} from './clients-redux'
import {IAppState} from './configureStore'
import {
	DECREASE_VIRTUAL_OCTAVE,
	INCREASE_VIRTUAL_OCTAVE,
	VIRTUAL_KEY_PRESSED,
	VIRTUAL_KEY_UP,
	VirtualKeyAction,
} from './virtual-keyboard-redux'

export interface ShamuAction extends AnyAction {
	isRemote?: boolean
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

	if (action.isRemote) {
		return next(action)
	}

	if (action.shouldBroadcast && !action.alreadyBroadcasted) {
		socket.emit(WebSocketEvent.broadcast, action)
		return next(action)
	} else if (action.dispatchOnServer) {
		socket.emit(WebSocketEvent.serverAction, action)
		return next(action)
	}

	switch (action.type) {
		case VIRTUAL_KEY_PRESSED:
		case VIRTUAL_KEY_UP:
			return onVirtualKey(action as VirtualKeyAction, store, next, socket, selectOwner(state))
		case INCREASE_VIRTUAL_OCTAVE:
		case DECREASE_VIRTUAL_OCTAVE:
			return onOctave(action, store, next, socket, selectOwner(state))
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
		socket.emit('notes', {notes: state.virtualKeyboards[action.ownerId].pressedKeys})
	}
}

function onOctave(action, store, next, socket, myClientId) {
	next(action)
	if (action.ownerId === myClientId.id) {
		const state: IAppState = store.getState()
		if (action.ownerId === state.websocket.myClientId) {
			socket.emit('octave', {octave: state.virtualKeyboards[action.ownerId].octave})
		}
	}
}
