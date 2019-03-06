import {logger} from '../../common/logger'
import {IInstrumentOptions, Instrument, OnEndedCallback, Voice, Voices} from './Instrument'
import {getOctaveFromMidiNote, midiNoteToNoteName} from './music-functions'
import {SamplesManager} from './SamplesManager'

export type IBasicSamplerOptions = IInstrumentOptions

export class BasicSamplerInstrument extends Instrument<SamplerVoices, SamplerVoice> {
	private readonly _voices: SamplerVoices

	constructor(options: IBasicSamplerOptions) {
		super(options)

		this._voices = new SamplerVoices(options.voiceCount, this._audioContext, this._panNode)
	}

	protected _getVoices = () => this._voices
}

class SamplerVoices extends Voices<SamplerVoice> {
	constructor(
		private readonly _voiceCount: number,
		private readonly _audioContext: AudioContext,
		private readonly _destination: AudioNode,
	) {
		super()

		for (let i = 0; i < this._voiceCount; i++) {
			const newVoice = this.createVoice(false)
			this._inactiveVoices = this._inactiveVoices.set(newVoice.id, newVoice)
		}
	}

	public createVoice(forScheduling: boolean) {
		return new SamplerVoice(
			this._audioContext,
			this._destination,
			forScheduling,
			this._getOnEndedCallback(),
		)
	}

	protected _getAudioContext() {return this._audioContext}
}

class SamplerVoice extends Voice {
	private _audioBufferSource: AudioBufferSourceNode | undefined

	constructor(
		audioContext: AudioContext, destination: AudioNode,
		forScheduling: boolean, onEnded: OnEndedCallback,
	) {
		super(audioContext, destination, onEnded)

		this._gain.connect(this._destination)
	}

	public getAudioNodeToStop() {
		return this._audioBufferSource
	}

	public playNote(note: number, attackTimeInSeconds: number) {
		this._beforePlayNote(attackTimeInSeconds)

		this._playSamplerNote(note)

		this._afterPlayNote(note)
	}

	public dispose() {
		this._disposeAudioBufferSource()
		this._dispose()
	}

	protected _scheduleNoteSpecific(note: number): void {
		this._disposeAudioBufferSource()
		this._audioBufferSource = this._audioContext.createBufferSource()
		this._audioBufferSource.buffer = SamplesManager.getSample(midiNoteToNoteName(note), getOctaveFromMidiNote(note))
	}

	private _playSamplerNote(note: number) {
		this._disposeAudioBufferSource()
		this._audioBufferSource = this._audioContext.createBufferSource()
		this._audioBufferSource.buffer = SamplesManager.getSample(midiNoteToNoteName(note), getOctaveFromMidiNote(note))
		this._audioBufferSource.connect(this._gain)
		this._audioBufferSource.start()
	}

	private _disposeAudioBufferSource() {
		if (this._audioBufferSource) {
			this._audioBufferSource.stop()
			this._audioBufferSource.disconnect()
			delete this._audioBufferSource
		}
	}
}
