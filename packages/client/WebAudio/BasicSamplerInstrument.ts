import {
	Samples, Sample, dummySample, dummySamplePath, makeSampleParams,
} from '@corgifm/common/common-samples-stuff'
import {IMidiNote} from '@corgifm/common/MidiNote'
import {
	IInstrumentOptions, Instrument,
	OnEndedCallback, SamplesManager,
	Voice, Voices,
} from '.'
import {BuiltInBQFilterType} from '@corgifm/common/OscillatorTypes';

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
			this._filter.type as BuiltInBQFilterType,
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
		_filterType: BuiltInBQFilterType,
		private _samples: Samples,
		private readonly _samplesManager: SamplesManager,
	) {
		super(_detune, _lowPassFilterCutoffFrequency, _filterType)
	}

	public setSamples(samples: Samples) {
		if (samples !== this._samples) {
			this._samples = samples
		}
	}

	protected getRelease(note: IMidiNote): number {
		const sample = this._samples.get(note, dummySample)
		return sample.parameters
			? sample.parameters.release
			: 1
	}

	protected _createVoice(invincible: boolean, note: IMidiNote) {
		const sample = this._samples.get(note, dummySample)
		return new SamplerVoice(
			this._audioContext,
			this._destination,
			this._getOnEndedCallback(),
			invincible,
			sample,
			sample.parameters || {...makeSampleParams(), gain: 1},
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
		invincible: boolean,
		private readonly _sample: Sample,
		private readonly _sampleParams: Required<Sample>['parameters'],
		private readonly _samplesManager: SamplesManager,
	) {
		super(
			audioContext, destination, onEnded,
			_sampleParams.attack, _sampleParams.decay, _sampleParams.sustain,
			_sampleParams.detune, _sampleParams.filterCutoff,
			_sampleParams.filterType, invincible, _sampleParams.gain,
			_sampleParams.pan)

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
			this._setSampleParams(this._sample.parameters)
		}
		this._isStarted = true
	}

	private _setSampleParams(params: Sample['parameters']) {
		if (!params) return
		// this._audioBufferSource.playbackRate.value = params.sustain
	}

	private _disposeAudioBufferSource() {
		if (this._audioBufferSource) {
			if (this._isStarted) {
				this._audioBufferSource.stop()
			}
			this._audioBufferSource.disconnect()
			delete this._audioBufferSource
		}
		this._isStarted = false
	}
}
