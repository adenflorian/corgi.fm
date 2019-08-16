import {List, Map} from 'immutable'
import {IMidiNote} from './MidiNote'
import {Octave, IKeyColors, NoteNameSharps} from './common-types'
import {BuiltInBQFilterType} from './OscillatorTypes'
import {defaultSamplePlaybackRate} from './common-constants'

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
	['red', 'blue', 'green', 'yellow', 'purple', 'orange'] as const

export interface Sample {
	readonly label: string
	readonly filePath: string
	readonly color: typeof sampleColors[number] | 'panelGrayLight'
	readonly parameters?: SampleParams
}

export interface SampleParams extends ReturnType<typeof makeSampleParams> {}

export function makeSampleParams() {
	return Object.freeze({
		attack: 0,
		decay: 0,
		sustain: 1,
		release: 1,
		pan: 0,
		filterCutoff: 20000,
		filterType: BuiltInBQFilterType.lowpass,
		detune: 0,
		playbackRate: defaultSamplePlaybackRate,
		gain: 0.5,
	})
}

export const dummySamplePath = 'dummySamplePath'

export const dummySample: Sample = {
	color: 'panelGrayLight',
	filePath: dummySamplePath,
	label: '?',
}

export const samplerBasicPianoNotes: Samples = samplesToGet.reduce(
	(samples, note): Samples => {

		return samples.withMutations(mutable => {
			octavesToGet.forEach(octave => {
				const midiNote = midiNoteFromNoteName(note, octave)
				mutable.set(midiNote, {
					label: `piano ${note}${octave}`,
					filePath: `static/samplers/basic-piano/${sharpToFlatNotes[note]}${octave}-49-96.mp3`,
					color: note.includes('#') ? 'green' : 'blue',
				})
			})
		})
	},
	makeSamples(),
)

const basicDrumSamples: Samples = makeSamples([
	[60, {color: 'blue', label: 'kick 135', filePath: 'kick-135.wav'}],
	[61, {color: 'blue', label: 'kick 125', filePath: 'kick-125.wav'}],
	[62, {color: 'blue', label: 'kick swedish', filePath: 'kick-swedish.wav'}],
	[63, {color: 'blue', label: 'kick bump', filePath: 'kick-bump.wav'}],
	[64, {color: 'green', label: 'snare 20', filePath: 'snare-20.wav'}],
	[65, {color: 'green', label: 'snare people', filePath: 'snare-people.wav'}],
	[66, {color: 'green', label: 'snare heavy', filePath: 'snare-heavy.wav'}],
	[67, {color: 'purple', label: 'hat skiba', filePath: 'hat-skiba.wav'}],
	[68, {color: 'purple', label: 'hat savannah', filePath: 'hat-savannah.wav'}],
	[69, {color: 'purple', label: 'hat open', filePath: 'hat-open.wav'}],
	[70, {color: 'orange', label: 'clap 1', filePath: 'clap-1.wav'}],
	[71, {color: 'orange', label: 'rim click', filePath: 'rim-click.wav'}],
	[72, {color: 'orange', label: 'bark rose', filePath: 'bark-rose.wav'}],
]).map(x => ({
	...x,
	filePath: 'static/samplers/basic-drums/' + x.filePath,
}))

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

export function midiNoteToNoteNameFull(midiNote: IMidiNote): string {
	const octave = getOctaveFromMidiNote(midiNote)
	const x = ((midiNote % 12) + 12) % 12
	return keyColors[x].name + octave.toString()
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
