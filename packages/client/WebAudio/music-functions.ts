import {List} from 'immutable'
import {IMidiNote} from '@corgifm/common/MidiNote'
import {Octave} from '@corgifm/common/common-types'
// @ts-ignore
// eslint-disable-next-line import/no-internal-modules
import {getFrequencyUsingHalfStepsFromA4 as getFrequencyUsingHalfStepsFromA4Rust} from '../client-rust/lib.rs'

export function getFrequencyUsingHalfStepsFromA4(halfSteps: number): number {
	return getFrequencyUsingHalfStepsFromA4Rust(halfSteps)
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
		color: KeyColor
		name: NoteNameSharps
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
})

export function roundRate(rawRate: number) {
	return rateValues.find(x => rawRate <= x) || rateValues.last(4)
}

// function nearestPow2(aSize: number) {
// 	return Math.pow(2, Math.round(Math.log(aSize) / Math.log(2)))
// }

// function nearestPow3(aSize: number) {
// 	return Math.pow(6, Math.round(Math.log(aSize) / Math.log(6)))
// }

// In beat units
export const rateValues = List([
	16,
	8,
	4,
	2,
	1 + 1 / 3,
	1,
	2 / 3,
	1 / 2,
	1 / 3,
	1 / 4,
	// 3 / 8,
	// 3 / 16,
	1 / 6,
	1 / 8,
	// 3 / 32,
	1 / 12,
	1 / 16,
	1 / 24,
	1 / 32,
	// 1 / 48,
	// 1 / 64,
	// 1 / 96,
	// 1 / 128,
]).reverse()
