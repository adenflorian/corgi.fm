import {IAppState} from './configureStore'
import {NOTE_UP, notePressed} from './notes-redux'
import {decreaseVirtualOctave, increaseVirtualOctave} from './virtual-keyboard-redux'
import {isMidiKey} from './virtual-midi-keyboard-middleware'

export const KEY_DOWN = 'KEY_DOWN'
export const KEY_UP = 'KEY_UP'

export const keyToNoteMap = {
	a: 'C',
	w: 'C#',
	s: 'D',
	e: 'D#',
	d: 'E',
	f: 'F',
	t: 'F#',
	g: 'G',
	y: 'G#',
	h: 'A',
	u: 'A#',
	j: 'B',
}

export const halfStepMap = {
	'a': 3,   // white C
	'w': 4,   // black C#
	's': 5,   // white D
	'e': 6,   // black D#
	'd': 7,   // white E
	'f': 8,   // white F
	't': 9,   // black F#
	'g': 10,   // white G
	'y': 11,   // black G#
	'h': 12,   // white A
	'u': 13,   // black A#
	'j': 14,   // white B
	'k': 15,   // white C
	'o': 16,   // black C#
	'l': 17,   // white D
	'p': 18,   // black D#
	';': 19,   // white E
	// stop at semi colon
	// single quote opens a quick find box
	// so we wouldn't want to sue that
}

export const keyToMidiMap = {
	a: 0,
	w: 1,
	s: 2,
	e: 3,
	d: 4,
	f: 5,
	t: 6,
	g: 7,
	y: 8,
	h: 9,
	u: 10,
	j: 12,
}

export const noteToHalfStepMap = Object.freeze({
	'C': 3,
	'C#': 4,
	'D': 5,
	'D#': 6,
	'E': 7,
	'F': 8,
	'F#': 9,
	'G': 10,
	'G#': 11,
	'A': 12,
	'A#': 13,
	'B': 14,
})

// const octaves = [-1, 0, 1, 2, 3, 4, 5, 6, 7]

// const midiNoteNumbersCount = 128
// const midiNoteFirstNumber = 0
// const notesPerOctave = 12

// const centerNoteName = 'A4'
// const centerNoteFrequency = 440
// const centerNoteMidiNumber = 69
// const centerNoteOctave = 69

// const firstOctave = -1
// const currentOctave = 4

export function applyOctave(midiNumber: number, octave: number) {
	if (octave === -1) return midiNumber

	return midiNumber + (octave * 12) + 12
}

// keyboard key + octave => midi key => note name => frequency

export const midiKeyToNote = Object.freeze({
	0: 'C',
	1: 'C#',
	2: 'D',
	3: 'D#',
	4: 'E',
	5: 'F',
	6: 'F#',
	7: 'G',
	8: 'G#',
	9: 'A',
	10: 'A#',
	12: 'B',
})

export const inputMiddleware = store => next => action => {
	next(action)

	if (action.type === KEY_DOWN) {
		onKeyDown(action.e, store)
	} else if (action.type === KEY_UP) {
		onKeyUp(action.e, store)
	}
}

function onKeyDown(e, store) {
	if (e.repeat) return

	const keyname = e.key

	const state: IAppState = store.getState()

	if (isMidiKey(keyname)) {
		store.dispatch(notePressed(keyToNoteMap[e.key]))
	} else if (keyname === 'x') {
		store.dispatch(increaseVirtualOctave(state.websocket.myClientId))
	} else if (keyname === 'z') {
		store.dispatch(decreaseVirtualOctave(state.websocket.myClientId))
	}
}

function onKeyUp(e, store) {
	const keyname = e.key

	if (isMidiKey(keyname) === false) return

	const note = keyToNoteMap[e.key]

	store.dispatch({
		type: NOTE_UP,
		note,
	})
	// store.dispatch(midiKeyUp(keyToMidiMap[keyname]))
}

export function getFrequencyUsingHalfStepsFromA4(halfSteps: number) {
	const fixedNoteFrequency = 440
	const twelthRootOf2 = Math.pow(2, 1 / 12) // 1.059463094359...

	return fixedNoteFrequency * Math.pow(twelthRootOf2, halfSteps)
}
