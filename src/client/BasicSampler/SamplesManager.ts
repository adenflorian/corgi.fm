import {isLocalDevClient} from '../is-prod-client'
import {NoteNameSharps} from '../music/music-functions'

const octaveToGet = '4'

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

		await samplesToGet.forEach(async sampleName => {
			const noteName = sampleName + octaveToGet

			const sample = await fetch(`${getUrl()}/${noteName}-49-96.mp3`)
				.then(async response => {
					return await audioContext.decodeAudioData(await response.arrayBuffer())
				})

			SamplesManager._samples.set(noteName, sample)
		})
	}

	public static getSample(noteName: NoteNameSharps) {
		const convertedName = convertNoteNameToFlatsName(noteName)
		const foo = SamplesManager._samples.get(convertedName + octaveToGet)
		if (foo === undefined) {
			throw new Error('could not find sample with note name: ' + noteName)
		}
		return foo
	}

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
