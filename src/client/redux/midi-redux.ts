import {combineReducers} from 'redux'
import {IMidiNote} from '../MidiNote'

export const MIDI_KEY_PRESSED = 'MIDI_KEY_PRESSED'
export const MIDI_KEY_UP = 'MIDI_KEY_UP'

export const midiKeyPressed = (number: number) => ({
	type: MIDI_KEY_PRESSED,
	number,
})

export const midiKeyUp = (number: number) => ({
	type: MIDI_KEY_UP,
	number,
})

export type Octave = number

export interface IMidiState {
	notes: IMidiNote[],
	octave: Octave
}

export const midiReducer = combineReducers({
	notes: midiNotesReducer,
	octave: octaveReducer,
})

function midiNotesReducer(state: IMidiNote[] = [], action) {
	switch (action.type) {
		case MIDI_KEY_PRESSED:
			if (state.some(x => x === action.number) || !action.number) {
				return state
			} else {
				return [...state, action.number]
			}
		case MIDI_KEY_UP:
			return state.filter(x => x !== action.number)
		default:
			return state
	}
}

function octaveReducer(state: Octave = 4, _) {
	return state
}

export function selectPressedMidiNotes(midi: IMidiState): IMidiNote[] {
	return midi.notes
}
