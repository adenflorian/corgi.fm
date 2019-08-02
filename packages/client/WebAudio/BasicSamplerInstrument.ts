import {
	midiNoteToNoteName, getOctaveFromMidiNote,
} from '@corgifm/common/common-samples-stuff'
import {
	IInstrumentOptions, Instrument,
	OnEndedCallback, SamplesManager,
	Voice, Voices,
} from '.'

export type IBasicSamplerOptions = IInstrumentOptions

export class BasicSamplerInstrument extends Instrument<SamplerVoices, SamplerVoice> {
	private readonly _voices: SamplerVoices

	public constructor(options: IBasicSamplerOptions) {
		super(options)

		this._voices = new SamplerVoices(
			this._audioContext,
			this._panNode,
			this._detune,
			this._lowPassFilterCutoffFrequency,
		)
	}

	protected _getVoices = () => this._voices
}

class SamplerVoices extends Voices<SamplerVoice> {
	public constructor(
		private readonly _audioContext: AudioContext,
		private readonly _destination: AudioNode,
		_detune: number,
		_lowPassFilterCutoffFrequency: number,
	) {
		super(_detune, _lowPassFilterCutoffFrequency)
	}

	protected _createVoice(invincible: boolean) {
		return new SamplerVoice(
			this._audioContext,
			this._destination,
			this._getOnEndedCallback(),
			this._detune,
			this._lowPassFilterCutoffFrequency,
			invincible,
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
		this._audioBufferSource.buffer =
			SamplesManager.getSample(
				midiNoteToNoteName(note), getOctaveFromMidiNote(note))
		this._isStarted = true
	}

	private _disposeAudioBufferSource() {
		if (this._isStarted) {
			this._audioBufferSource.stop()
		}
		this._audioBufferSource.disconnect()
		delete this._audioBufferSource
		this._isStarted = false
	}
}
