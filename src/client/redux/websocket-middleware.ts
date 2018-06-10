import {CLIENT_DISCONNECTED, CLIENT_DISCONNECTING, clientDisconnecting} from './clients-redux'
import {IAppState} from './configureStore'
import {MIDI_KEY_PRESSED, MIDI_KEY_UP, selectPressedMidiNotes} from './midi-redux'

export const websocketMiddleware = store => next => action => {
	if (action.type === MIDI_KEY_PRESSED || action.type === MIDI_KEY_UP) {
		next(action)
		const state: IAppState = store.getState()
		const pressedMidiNotes = selectPressedMidiNotes(state.midi)
		const socket = state.websocket.socket

		socket.emit('notes', {notes: pressedMidiNotes})
	} else if (action.type === CLIENT_DISCONNECTED) {
		store.dispatch(clientDisconnecting(action.id))

		setTimeout(() => {
			next(action)
		}, 2000)
	} else {
		next(action)
	}
}
