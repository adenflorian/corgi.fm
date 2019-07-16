import {isLocalDevClient} from '../is-prod-client'
import {NoteNameSharps} from '../WebAudio/music-functions'
import {Octave} from '../WebAudio/music-types'

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

		await samplesToGet.forEach(async sampleName => {
			await octavesToGet.forEach(async octave => {
				const noteName = sampleName + octave

				if (noteName === 'Gb7' || noteName === 'Ab3') return

				const sample = await fetch(`${getUrl()}/${noteName}-49-96.mp3`)
					.then(async response => {
						return await audioContext.decodeAudioData(await response.arrayBuffer())
					})

				SamplesManager._samples.set(noteName, sample)
			})
		})
	}

	public static getSample(noteName: NoteNameSharps, octave: Octave = 4) {
		const convertedName = convertNoteNameToFlatsName(noteName)
		const foo = SamplesManager._samples.get(convertedName + octave)
		return foo || SamplesManager._emptyAudioBuffer
	}

	private static _emptyAudioBuffer: AudioBuffer
	private static _isInitialized = false
	private static readonly _samples = new Map<string, AudioBuffer>()
}

function getUrl() {
	if (isLocalDevClient()) {
		return `http://${window.location.hostname}:3000`
	} else {
		return `https://${window.location.host}`
	}
}

function convertNoteNameToFlatsName(noteName: NoteNameSharps) {
	return sharpToFlatNotes[noteName]
}
