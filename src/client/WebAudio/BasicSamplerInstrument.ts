import {IInstrumentOptions, Instrument, Voice, Voices} from './Instrument'
import {getOctaveFromMidiNote, midiNoteToNoteName} from './music-functions'
import {SamplesManager} from './SamplesManager'

export type IBasicSamplerOptions = IInstrumentOptions

export class BasicSamplerInstrument extends Instrument<SamplerVoices, SamplerVoice> {
	private readonly _voices: SamplerVoices

	constructor(options: IBasicSamplerOptions) {
		super(options)

		this._voices = new SamplerVoices(options.voiceCount, this._audioContext, this._panNode)
	}

	public dispose = () => {
		this._voices.dispose()

		this._dispose()
	}

	protected _getVoices = () => this._voices
}

class SamplerVoices extends Voices<SamplerVoice> {
	constructor(voiceCount: number, audioContext: AudioContext, destination: AudioNode) {
		super()

		for (let i = 0; i < voiceCount; i++) {
			this._inactiveVoices.push(new SamplerVoice(audioContext, destination))
		}
	}
}

class SamplerVoice extends Voice {
	private _audioBufferSource: AudioBufferSourceNode

	constructor(audioContext: AudioContext, destination: AudioNode) {
		super(audioContext, destination)

		this._gain.connect(this._destination)

		this._audioBufferSource = this._audioContext.createBufferSource()
		this._audioBufferSource.start()
	}

	public playNote(note: number, attackTimeInSeconds: number) {
		this._beforePlayNote(attackTimeInSeconds)

		this._playSamplerNote(note)

		this._afterPlayNote(note)
	}

	public readonly dispose = () => {
		this._audioBufferSource.stop()
		this._audioBufferSource.disconnect()
		delete this._audioBufferSource
		this._dispose()
	}

	private _playSamplerNote(note: number) {
		this._audioBufferSource.stop()
		this._audioBufferSource.disconnect()
		delete this._audioBufferSource
		this._audioBufferSource = this._audioContext.createBufferSource()
		this._audioBufferSource.buffer = SamplesManager.getSample(midiNoteToNoteName(note), getOctaveFromMidiNote(note))
		this._audioBufferSource.connect(this._gain)
		this._audioBufferSource.start()
	}
}
