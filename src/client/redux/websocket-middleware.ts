import {IAppState} from './configureStore'
import {MIDI_KEY_PRESSED, MIDI_KEY_UP, selectPressedMidiNotes} from './midi-redux'

export const websocketMiddleware = store => next => action => {
	next(action)

	if (action.type === MIDI_KEY_PRESSED || action.type === MIDI_KEY_UP) {
		const state: IAppState = store.getState()
		const pressedMidiNotes = selectPressedMidiNotes(state.midi)
		const socket = state.websocket.socket

		socket.emit('notes', {notes: pressedMidiNotes})
	}
}
