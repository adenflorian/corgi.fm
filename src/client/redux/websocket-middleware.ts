import {IAppState} from './configureStore'
import {getFrequencyUsingHalfStepsFromA4, noteToHalfStepMap} from './input-middleware'
import {MIDI_KEY_PRESSED, MIDI_KEY_UP, selectPressedMidiNotes} from './midi-redux'
import {NOTE_PRESSED, NOTE_UP, selectPressedNotes} from './notes-redux'

export const websocketMiddleware = store => next => action => {
	next(action)

	if (action.type === NOTE_PRESSED || action.type === NOTE_UP) {
		const state: IAppState = store.getState()
		const pressedNotes = selectPressedNotes(state.notes)
		const socket = state.websocket.socket

		if (pressedNotes.length === 0) {
			socket.emit('note', {frequency: 0})
		} else {
			const note = pressedNotes[0]
			const halfSteps = noteToHalfStepMap[note]
			const frequency = getFrequencyUsingHalfStepsFromA4(halfSteps)

			socket.emit('note', {frequency, note})
		}
	}

	if (action.type === MIDI_KEY_PRESSED || action.type === MIDI_KEY_UP) {
		const state: IAppState = store.getState()
		const pressedMidiNotes = selectPressedMidiNotes(state.midi)
		const socket = state.websocket.socket

		socket.emit('notes', {notes: pressedMidiNotes})
	}
}
