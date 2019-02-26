import {IInstrumentOptions, Instrument, Voice, Voices} from './Instrument'
import {getOctaveFromMidiNote, midiNoteToNoteName} from './music-functions'
import {SamplesManager} from './SamplesManager'
import {IMidiNote} from '../../common/MidiNote';

export type IBasicSamplerOptions = IInstrumentOptions

export class BasicSamplerInstrument extends Instrument<SamplerVoices, SamplerVoice> {
	private readonly _voices: SamplerVoices

	constructor(options: IBasicSamplerOptions) {
		super(options)

		this._voices = new SamplerVoices(options.voiceCount, this._audioContext, this._panNode)
	}

	public scheduleNote(note: IMidiNote, delaySeconds: number) {}
	public scheduleRelease(note: number, delaySeconds: number) {}

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
			const newVoice = new SamplerVoice(audioContext, destination)
			this._inactiveVoices = this._inactiveVoices.set(newVoice.id, newVoice)
		}
	}
}

class SamplerVoice extends Voice {
	private _audioBufferSource: AudioBufferSourceNode | undefined

	constructor(audioContext: AudioContext, destination: AudioNode) {
		super(audioContext, destination)

		this._gain.connect(this._destination)
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
