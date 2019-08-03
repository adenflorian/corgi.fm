import {Octave} from '@corgifm/common/common-types'
import {samplesToGet, octavesToGet, sharpToFlatNotes, NoteNameSharps} from '@corgifm/common/common-samples-stuff'
import {getCdnUrl} from '../client-utils'

export class SamplesManager {
	private static _emptyAudioBuffer: AudioBuffer
	private static _isInitialized = false
	private static readonly _samples = new Map<string, AudioBuffer>()

	public static readonly initAsync = async (audioContext: AudioContext) => {
		if (SamplesManager._isInitialized) return

		SamplesManager._isInitialized = true

		SamplesManager._emptyAudioBuffer =
			new AudioBuffer({length: 1, sampleRate: audioContext.sampleRate})

		samplesToGet.forEach(async sampleName => {
			octavesToGet.forEach(async octave => {
				const noteName = sharpToFlatNotes[sampleName] + octave.toString()

				// if (noteName === 'Gb7' || noteName === 'Ab3') return

				const sample = await fetch(
					`${getCdnUrl()}/static/samplers/basic-piano/${noteName}-49-96.mp3`,
					{mode: 'cors'}
				)
					.then(async response => {
						return audioContext.decodeAudioData(await response.arrayBuffer())
					})

				SamplesManager._samples.set(noteName, sample)
			})
		})
	}

	public static getSample(noteName: NoteNameSharps, octave: Octave) {
		const convertedName = convertNoteNameToFlatsName(noteName)
		const foo = SamplesManager._samples.get(convertedName + octave.toString())
		return foo || SamplesManager._emptyAudioBuffer
	}
}

function convertNoteNameToFlatsName(noteName: NoteNameSharps): string {
	return sharpToFlatNotes[noteName]
}
