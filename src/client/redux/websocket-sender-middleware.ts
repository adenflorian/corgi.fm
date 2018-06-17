import {WebSocketEvent} from '../../server/server-constants'
import {CLIENT_DISCONNECTED, clientDisconnecting, selectOwner} from './clients-redux'
import {IAppState} from './configureStore'
import {SET_SIMPLE_TRACK_NOTE} from './simple-track-redux'
import {
	PLAY_SIMPLE_TRACK,
	REFRESH_SIMPLE_TRACK_PLAYER_EVENTS, RESTART_SIMPLE_TRACK, STOP_SIMPLE_TRACK,
} from './track-player-middleware'
import {
	DECREASE_VIRTUAL_OCTAVE,
	INCREASE_VIRTUAL_OCTAVE,
	VIRTUAL_KEY_PRESSED,
	VIRTUAL_KEY_UP,
	VirtualKeyAction,
} from './virtual-keyboard-redux'

export const websocketSenderMiddleware = store => next => action => {
	const state: IAppState = store.getState()
	const socket = state.websocket.socket

	if (action.isRemote) {
		return next(action)
	}

	switch (action.type) {
		case VIRTUAL_KEY_PRESSED:
		case VIRTUAL_KEY_UP:
			return onVirtualKey(action, store, next, socket, selectOwner(state))
		case INCREASE_VIRTUAL_OCTAVE:
		case DECREASE_VIRTUAL_OCTAVE:
			return onOctave(action, store, next, socket, selectOwner(state))
		case CLIENT_DISCONNECTED:
			store.dispatch(clientDisconnecting(action.id))

			setTimeout(() => {
				next(action)
			}, 2000)
			return next(action)
		case SET_SIMPLE_TRACK_NOTE:
			socket.emit('SET_TRACK_SIMPLE_TRACK_NOTE', action)
			return next(action)
		case PLAY_SIMPLE_TRACK:
			socket.emit(WebSocketEvent.RepeatToOthers, {eventName: PLAY_SIMPLE_TRACK})
			return next(action)
		case STOP_SIMPLE_TRACK:
			socket.emit(WebSocketEvent.RepeatToOthers, {eventName: STOP_SIMPLE_TRACK})
			return next(action)
		case RESTART_SIMPLE_TRACK:
			socket.emit(WebSocketEvent.RepeatToOthers, {eventName: RESTART_SIMPLE_TRACK})
			return next(action)
		case REFRESH_SIMPLE_TRACK_PLAYER_EVENTS:
			socket.emit(WebSocketEvent.RepeatToOthers, {eventName: REFRESH_SIMPLE_TRACK_PLAYER_EVENTS})
			return next(action)
		default:
			return next(action)
	}
}

function onVirtualKey(action: VirtualKeyAction, store, next, socket, myClientId) {
	next(action)
	if (action.ownerId === myClientId) {
		const state: IAppState = store.getState()
		socket.emit('notes', {notes: state.virtualKeyboards[action.ownerId].pressedKeys})
	}
}

function onOctave(action, store, next, socket, myClientId) {
	next(action)
	if (action.ownerId === myClientId) {
		const state: IAppState = store.getState()
		if (action.ownerId === state.websocket.myClientId) {
			socket.emit('octave', {octave: state.virtualKeyboards[action.ownerId].octave})
		}
	}
}
