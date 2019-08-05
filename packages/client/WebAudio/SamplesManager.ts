import {logger} from '@corgifm/common/logger'
import {getCdnUrl} from '../client-utils'

// if (noteName === 'Gb7' || noteName === 'Ab3') return

enum SampleStatus {
	Requested = 'Requested',
	Loaded = 'Loaded',
	NotLoaded = 'NotLoaded',
}

export class SamplesManager {
	private readonly _audioContext: AudioContext
	private readonly _emptyAudioBuffer: AudioBuffer
	private readonly _samplesCache = new Map<string, AudioBuffer>()
	private readonly _samplesStatus = new Map<string, SampleStatus>()

	public constructor(audioContext: AudioContext) {
		this._audioContext = audioContext
		this._emptyAudioBuffer =
			new AudioBuffer({length: 1, sampleRate: audioContext.sampleRate})
	}

	/** Returns sample from cache or starts to load it and returns empty
	 * buffer. */
	public getSample(path: string) {
		const sample = this._samplesCache.get(path)

		if (sample) {
			return sample
		} else {
			logger.warn(`[SamplesManager.getSample] sample wasn't loaded: `, path)
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			this.loadSampleAsync(path)
			return this._emptyAudioBuffer
		}
	}

	/** You probably don't want to `await` this. */
	public async loadSampleAsync(path: string) {
		const status = this._samplesStatus.get(path) || SampleStatus.NotLoaded

		if (status !== SampleStatus.NotLoaded) return

		this._samplesStatus.set(path, SampleStatus.Requested)

		const sample = await fetch(
			`${getCdnUrl()}/static/samplers/${path}`,
			{mode: 'cors'}
		)
			.then(async response => {
				return this._audioContext.decodeAudioData(
					await response.arrayBuffer())
			})

		// const MB = sample.length * sample.numberOfChannels * 4 / 1000 / 1000

		// console.log(`${path} ${MB.toFixed(3)}MB`)

		this._samplesCache.set(path, sample)
		this._samplesStatus.set(path, SampleStatus.Loaded)
	}
}
