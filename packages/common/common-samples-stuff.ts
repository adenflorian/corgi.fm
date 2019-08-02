import {List, Map, OrderedMap} from 'immutable'
import {IMidiNote} from './MidiNote'
import {Octave} from './common-types'

// const octaveToGet = '4'
export const octavesToGet = [1, 2, 3, 4, 5, 6, 7]

export const samplesToGet = List([
	'C',
	'Db',
	'D',
	'Eb',
	'E',
	'F',
	'Gb',
	'G',
	'Ab',
	'A',
	'Bb',
	'B',
])

export const sharpToFlatNotes = {
	'C': 'C',
	'C#': 'Db',
	'D': 'D',
	'D#': 'Eb',
	'E': 'E',
	'F': 'F',
	'F#': 'Gb',
	'G': 'G',
	'G#': 'Ab',
	'A': 'A',
	'A#': 'Bb',
	'B': 'B',
}

export type NoteNameSharps = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B'

export type NoteNameFlats = 'C' | 'Db' | 'D' | 'Eb' | 'E' | 'F' | 'Gb' | 'G' | 'Ab' | 'A' | 'Bb' | 'B'

export type KeyColor = 'white' | 'black'

export interface IKeyColors {
	readonly [key: number]: {
		readonly color: KeyColor
		readonly name: NoteNameSharps
	}
}

export const keyColors: IKeyColors = {
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
}

export const noteNameToMidi: {[noteName: string]: number} = {
	C: 0,
	Db: 1,
	D: 2,
	Eb: 3,
	E: 4,
	F: 5,
	Gb: 6,
	G: 7,
	Ab: 8,
	A: 9,
	Bb: 10,
	B: 11,
}

/** Key is a midi note as string */
export type Samples = OrderedMap<number, Sample>

export const makeSamples = (arg?: Samples): Samples => OrderedMap<number, Sample>(arg || [])

export interface Sample {
	// readonly note: IMidiNote
	readonly label: string
	readonly filePath: string
}

export const samplerBasicPianoNotes: Samples = samplesToGet.reduce(
	(samples, note): Samples => {
		const finalNote = `${note}4`
		const midiNote = midiNoteFromNoteName(note, 4)

		return samples.set(midiNote, {
			label: finalNote,
			filePath: finalNote + `-49-96.mp3`,
		})
	},
	makeSamples(),
)

export function midiNoteFromNoteName(noteName: string, octave: Octave): IMidiNote {
	const midiNoteBase = noteNameToMidi[noteName]
	return midiNoteBase + (octave * 12) + 12
}

export function midiNoteToNoteName(midiNote: IMidiNote): NoteNameSharps {
	const x = ((midiNote % 12) + 12) % 12
	return keyColors[x].name
}

export function getOctaveFromMidiNote(midiNote: IMidiNote): Octave {
	return Math.floor(midiNote / 12)
}

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
