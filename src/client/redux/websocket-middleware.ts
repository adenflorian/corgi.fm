import {CLIENT_DISCONNECTED, clientDisconnecting} from './clients-redux'
import {IAppState} from './configureStore'
import {
	DECREASE_VIRTUAL_OCTAVE,
	INCREASE_VIRTUAL_OCTAVE,
	VIRTUAL_KEY_PRESSED,
	VIRTUAL_KEY_UP,
} from './virtual-keyboard-redux'

export const websocketMiddleware = store => next => action => {
	switch (action.type) {
		// case MIDI_KEY_PRESSED:
		// case MIDI_KEY_UP:
		// 	next(action)
		// 	const pressedMidiNotes = selectPressedMidiNotes(state.midi)

		// 	socket.emit('notes', {notes: pressedMidiNotes})
		// 	break
		case VIRTUAL_KEY_PRESSED:
		case VIRTUAL_KEY_UP:
			return onVirtualKey(action, store, next)
		case INCREASE_VIRTUAL_OCTAVE:
		case DECREASE_VIRTUAL_OCTAVE:
			return onOctave(action, store, next)
		case CLIENT_DISCONNECTED:
			store.dispatch(clientDisconnecting(action.id))

			setTimeout(() => {
				next(action)
			}, 2000)
			break
		default:
			next(action)
			break
	}
}

function onVirtualKey(action, store, next) {
	next(action)
	const state: IAppState = store.getState()
	const socket = state.websocket.socket

	socket.emit('notes', {notes: state.virtualKeyboards[action.ownerId].pressedKeys})
}

function onOctave(action, store, next) {
	next(action)
	const state: IAppState = store.getState()
	const socket = state.websocket.socket

	if (action.ownerId === state.websocket.myClientId) {
		socket.emit('octave', {octave: state.virtualKeyboards[action.ownerId].octave})
	}
}
