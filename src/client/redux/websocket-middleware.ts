import {CLIENT_DISCONNECTED, clientDisconnecting} from './clients-redux'
import {IAppState} from './configureStore'
import {SET_TRACK_SIMPLE_TRACK_NOTE} from './simple-track-redux'
import {
	DECREASE_VIRTUAL_OCTAVE,
	INCREASE_VIRTUAL_OCTAVE,
	VIRTUAL_KEY_PRESSED,
	VIRTUAL_KEY_UP,
} from './virtual-keyboard-redux'

export const websocketMiddleware = store => next => action => {
	const state: IAppState = store.getState()
	const socket = state.websocket.socket

	if (action.isRemote) {
		return next(action)
	}

	switch (action.type) {
		case VIRTUAL_KEY_PRESSED:
		case VIRTUAL_KEY_UP:
			return onVirtualKey(action, store, next, socket)
		case INCREASE_VIRTUAL_OCTAVE:
		case DECREASE_VIRTUAL_OCTAVE:
			return onOctave(action, store, next, socket)
		case CLIENT_DISCONNECTED:
			store.dispatch(clientDisconnecting(action.id))

			setTimeout(() => {
				next(action)
			}, 2000)
			break
		case SET_TRACK_SIMPLE_TRACK_NOTE:
			socket.emit('SET_TRACK_SIMPLE_TRACK_NOTE', action)
		default:
			return next(action)
	}
}

function onVirtualKey(action, store, next, socket) {
	next(action)
	const state: IAppState = store.getState()
	socket.emit('notes', {notes: state.virtualKeyboards[action.ownerId].pressedKeys})
}

function onOctave(action, store, next, socket) {
	next(action)
	const state: IAppState = store.getState()
	if (action.ownerId === state.websocket.myClientId) {
		socket.emit('octave', {octave: state.virtualKeyboards[action.ownerId].octave})
	}
}
