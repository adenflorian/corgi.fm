import {
	Samples, Sample, dummySample, dummySamplePath,
} from '@corgifm/common/common-samples-stuff'
import {IMidiNote} from '@corgifm/common/MidiNote'
import {
	IInstrumentOptions, Instrument,
	OnEndedCallback, SamplesManager,
	Voice, Voices,
} from '.'

export interface IBasicSamplerOptions extends IInstrumentOptions {
	samples: Samples
	samplesManager: SamplesManager
}

export class BasicSamplerInstrument
	extends Instrument<SamplerVoices, SamplerVoice> {

	private readonly _voices: SamplerVoices

	public constructor(options: IBasicSamplerOptions) {
		super(options)

		this._voices = new SamplerVoices(
			this._audioContext,
			this._panNode,
			this._detune,
			this._lowPassFilterCutoffFrequency,
			options.samples,
			options.samplesManager,
		)
	}

	public setSamples(samples: Samples) {
		this._voices.setSamples(samples)
	}

	protected _getVoices = () => this._voices
}

class SamplerVoices extends Voices<SamplerVoice> {
	public constructor(
		private readonly _audioContext: AudioContext,
		private readonly _destination: AudioNode,
		_detune: number,
		_lowPassFilterCutoffFrequency: number,
		private _samples: Samples,
		private readonly _samplesManager: SamplesManager,
	) {
		super(_detune, _lowPassFilterCutoffFrequency)
	}

	public setSamples(samples: Samples) {
		if (samples !== this._samples) {
			this._samples = samples
		}
	}

	protected _createVoice(invincible: boolean, note: IMidiNote) {
		return new SamplerVoice(
			this._audioContext,
			this._destination,
			this._getOnEndedCallback(),
			this._detune,
			this._lowPassFilterCutoffFrequency,
			invincible,
			this._samples.get(note, dummySample),
			this._samplesManager,
		)
	}

	protected _getAudioContext() {return this._audioContext}
}

class SamplerVoice extends Voice {
	private _audioBufferSource: AudioBufferSourceNode
	private _isStarted = false

	public constructor(
		audioContext: AudioContext,
		destination: AudioNode,
		onEnded: OnEndedCallback,
		detune: number,
		lowPassFilterCutoffFrequency: number,
		invincible: boolean,
		private readonly _sample: Sample,
		private readonly _samplesManager: SamplesManager,
	) {
		super(
			audioContext, destination, onEnded, detune,
			lowPassFilterCutoffFrequency, invincible)

		this._audioBufferSource = this._audioContext.createBufferSource()

		this._gain.connect(this._destination)
	}

	public getAudioScheduledSourceNode() {
		return this._audioBufferSource
	}

	public dispose() {
		this._disposeAudioBufferSource()
		this._dispose()
	}

	protected _scheduleNoteSpecific(note: number): void {
		this._disposeAudioBufferSource()
		this._audioBufferSource = this._audioContext.createBufferSource()
		if (this._sample.filePath !== dummySamplePath) {
			this._audioBufferSource.buffer =
				this._samplesManager.getSample(this._sample.filePath)
		}
		this._isStarted = true
	}

	private _disposeAudioBufferSource() {
		if (this._isStarted) {
			this._audioBufferSource.stop()
		}
		this._audioBufferSource && this._audioBufferSource.disconnect()
		this._audioBufferSource && delete this._audioBufferSource
		this._isStarted = false
	}
}
