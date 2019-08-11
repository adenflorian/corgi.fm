import {logger} from '@corgifm/common/logger'
import {dummySamplePath} from '@corgifm/common/common-samples-stuff'
import {getCdnUrl} from '../client-utils'

// if (noteName === 'Gb7' || noteName === 'Ab3') return

enum SampleStatus {
	Requested = 'Requested',
	Loaded = 'Loaded',
}

/** Not room specific. Loads and caches samples. */
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
			if (this._samplesStatus.get(path) === undefined) {
				if (path === dummySamplePath) {
					logger.warn(`getSample should not be called with dummy sample, dummy`)
					return this._emptyAudioBuffer
				} else {
					logger.warn(`sample wasn't requested first: `, path)
				}
			}
			this.loadSample(path)
			return this._emptyAudioBuffer
		}
	}

	public async validateAudioSampleAsync(buffer: ArrayBuffer): Promise<boolean> {
		return this._audioContext.decodeAudioData(buffer)
			.then(() => true)
			.catch(() => false)
	}

	/** Fire and forget */
	public loadSample(path: string): void {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		this._loadSample(path)
			.catch(error => {
				logger.error('error in _loadSample:', {error})
			})
	}

	private async _loadSample(path: string): Promise<void> {
		const status = this._samplesStatus.get(path)

		if (status !== undefined) return

		if (path === dummySamplePath) {
			return logger.warn(
				`loadSampleAsync should not be called with dummy sample, dummy`)
		}

		this._samplesStatus.set(path, SampleStatus.Requested)

		const url = `${getCdnUrl()}${path}`

		const sample = await fetch(url, {mode: 'cors'})
			.then(async response => response.arrayBuffer())
			.then(async buffer => this._audioContext.decodeAudioData(buffer))

		// const MB = sample.length * sample.numberOfChannels * 4 / 1000 / 1000

		// console.log(`${path} ${MB.toFixed(3)}MB`)

		this._samplesCache.set(path, sample)
		this._samplesStatus.set(path, SampleStatus.Loaded)
	}
}
