import {Octave} from '@corgifm/common/common-types'
import {NoteNameSharps} from '../WebAudio/music-functions'
import {getCdnUrl} from '../client-utils'

// const octaveToGet = '4'
const octavesToGet = [1, 2, 3, 4, 5, 6, 7]

const samplesToGet = [
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
]

const sharpToFlatNotes = {
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

export class SamplesManager {

	public static readonly initAsync = async (audioContext: AudioContext) => {
		if (SamplesManager._isInitialized) return

		SamplesManager._isInitialized = true

		SamplesManager._emptyAudioBuffer = new AudioBuffer({length: 1, sampleRate: audioContext.sampleRate})

		samplesToGet.forEach(async sampleName => {
			octavesToGet.forEach(async octave => {
				const noteName = sampleName + octave.toString()

				if (noteName === 'Gb7' || noteName === 'Ab3') return

				const sample = await fetch(`${getCdnUrl()}/${noteName}-49-96.mp3`)
					.then(async response => {
						return audioContext.decodeAudioData(await response.arrayBuffer())
					})

				SamplesManager._samples.set(noteName, sample)
			})
		})
	}

	public static getSample(noteName: NoteNameSharps, octave: Octave = 4) {
		const convertedName = convertNoteNameToFlatsName(noteName)
		const foo = SamplesManager._samples.get(convertedName + octave.toString())
		return foo || SamplesManager._emptyAudioBuffer
	}

	private static _emptyAudioBuffer: AudioBuffer
	private static _isInitialized = false
	private static readonly _samples = new Map<string, AudioBuffer>()
}

function convertNoteNameToFlatsName(noteName: NoteNameSharps) {
	return sharpToFlatNotes[noteName]
}
