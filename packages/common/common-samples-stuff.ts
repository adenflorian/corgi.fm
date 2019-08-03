import {List, Map} from 'immutable'
import {IMidiNote} from './MidiNote'
import {Octave} from './common-types'
import {pickRandomArrayElement} from './common-utils'
import {CssColor} from './shamu-color'

export const octavesToGet = [1, 2, 3, 4, 5, 6, 7] as const

export const samplesToGet = [
	'C',
	'C#',
	'D',
	'D#',
	'E',
	'F',
	'F#',
	'G',
	'G#',
	'A',
	'A#',
	'B',
] as const

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
} as const

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

export const noteNameToMidi = {
	'C': 0,
	'C#': 1,
	'Db': 1,
	'D': 2,
	'D#': 3,
	'Eb': 3,
	'E': 4,
	'F': 5,
	'F#': 6,
	'Gb': 6,
	'G': 7,
	'G#': 8,
	'Ab': 8,
	'A': 9,
	'A#': 10,
	'Bb': 10,
	'B': 11,
} as const

/** Key is a midi note as string */
export interface Samples extends Map<number, Sample> {}

export const makeSamples =
	(collection: Iterable<[number, Sample]> = []): Samples =>
		Map<number, Sample>(collection)

export const sampleColors =
	['red', 'blue', 'green', 'yellow', 'purple'] as const

export interface Sample {
	readonly label: string
	readonly filePath: string
	readonly color: typeof sampleColors[number] | 'panelGrayDark'
}

export const samplerBasicPianoNotes: Samples = samplesToGet.reduce(
	(samples, note): Samples => {

		return samples.withMutations(mutable => {
			octavesToGet.forEach(octave => {
				const midiNote = midiNoteFromNoteName(note, octave)
				mutable.set(midiNote, {
					label: `${note}${octave}`,
					filePath: `${sharpToFlatNotes[note]}${octave}-49-96.mp3`,
					color: pickRandomArrayElement(sampleColors),
				})
			})
		})
	},
	makeSamples(),
)

const basicDrumSamples: Samples = makeSamples([
	[60, {color: 'blue', label: 'kick 135', filePath: 'basic-drums/kick-135.wav'}],
	[61, {color: 'blue', label: 'kick 125', filePath: 'basic-drums/kick-125.wav'}],
	[62, {color: 'blue', label: 'kick swedish', filePath: 'basic-drums/kick-swedish.wav'}],
	[63, {color: 'blue', label: 'kick bump', filePath: 'basic-drums/kick-bump.wav'}],
	[64, {color: 'green', label: 'snare 20', filePath: 'basic-drums/snare-20.wav'}],
	[65, {color: 'green', label: 'snare people', filePath: 'basic-drums/snare-people.wav'}],
	[66, {color: 'green', label: 'snare heavy', filePath: 'basic-drums/snare-heavy.wav'}],
	[67, {color: 'purple', label: 'hat skiba', filePath: 'basic-drums/hat-skiba.wav'}],
	[68, {color: 'purple', label: 'hat savannah', filePath: 'basic-drums/hat-savannah.wav'}],
	[69, {color: 'purple', label: 'clap 1', filePath: 'basic-drums/clap-1.wav'}],
	[70, {color: 'purple', label: 'rim click', filePath: 'basic-drums/rim-click.wav'}],
	[71, {color: 'purple', label: 'bark rose', filePath: 'basic-drums/bark-rose.wav'}],
])

export const defaultSamples = Map({
	basicPiano: samplerBasicPianoNotes,
	basicDrums: basicDrumSamples,
})

export function midiNoteFromNoteName(noteName: NoteNameSharps, octave: Octave): IMidiNote {
	const midiNoteBase = noteNameToMidi[noteName]
	return midiNoteBase + (octave * 12) + 12
}

export function midiNoteToNoteName(midiNote: IMidiNote): NoteNameSharps {
	const x = ((midiNote % 12) + 12) % 12
	return keyColors[x].name
}

export function getOctaveFromMidiNote(midiNote: IMidiNote): Octave {
	return Math.floor((midiNote - 12) / 12)
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
