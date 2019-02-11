import {IMidiNote} from '../../common/MidiNote'
import {Octave} from './music-types'

export function applyOctave(midiNumber: number, octave: number) {
	if (octave === -1) return midiNumber

	return midiNumber + (octave * 12) + 12
}

export function removeOctave(midiNumber: number) {
	return midiNumber % 12
}

export function getFrequencyUsingHalfStepsFromA4(halfSteps: number) {
	const fixedNoteFrequency = 440
	const twelfthRootOf2 = Math.pow(2, 1 / 12) // 1.059463094359...

	return fixedNoteFrequency * Math.pow(twelfthRootOf2, halfSteps)
}

export const A4 = 69

export function midiNoteToFrequency(midiNote: IMidiNote): number {
	if (midiNote === undefined) return 0

	const halfStepsFromA4 = midiNote - A4
	return getFrequencyUsingHalfStepsFromA4(halfStepsFromA4)
}

export function midiNoteToNoteName(midiNote: IMidiNote): NoteNameSharps {
	const x = ((midiNote % 12) + 12) % 12
	return keyColors[x].name
}

export function getOctaveFromMidiNote(midiNote: IMidiNote): Octave {
	return Math.floor(midiNote / 12)
}

export type NoteNameSharps = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B'

export type NoteNameFlats = 'C' | 'Db' | 'D' | 'Eb' | 'E' | 'F' | 'Gb' | 'G' | 'Ab' | 'A' | 'Bb' | 'B'

export type KeyColor = 'white' | 'black'

export interface IKeyColors {
	[key: number]: {
		color: KeyColor,
		name: NoteNameSharps,
	}
}

export const keyColors: Readonly<IKeyColors> = Object.freeze({
	0: {color: 'white', name: 'C'},
	1: {color: 'black', name: 'C#'},
	2: {color: 'white', name: 'D'},
	3: {color: 'black', name: 'D#'},
	4: {color: 'white', name: 'E'},
	5: {color: 'white', name: 'F'},
	6: {color: 'black', name: 'F#'},
	7: {color: 'white', name: 'G'},
	8: {color: 'black', name: 'G#'},
	9: {color: 'white', name: 'A'},
	10: {color: 'black', name: 'A#'},
	11: {color: 'white', name: 'B'},
} as IKeyColors)
