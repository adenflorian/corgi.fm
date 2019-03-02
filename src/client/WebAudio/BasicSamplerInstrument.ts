import {getOctaveFromMidiNote, midiNoteToNoteName} from '../../common/music-functions'
import {Voice} from './index'
import {SamplesManager} from './index'
import {InnerVoice} from './Instrument'

export class SamplerVoice implements InnerVoice {
	private _audioBufferSource: AudioBufferSourceNode | undefined

	constructor(audioContext: AudioContext, destination: AudioNode, forScheduling: boolean) {
		super(audioContext, destination)

		this._gain.connect(this._destination)
	}

	protected _dispose() {
		this._disposeAudioBufferSource()
	}

	protected _scheduleNote(note: number, attackTimeInSeconds: number, delaySeconds: number): void {
		this._attackStartTimeSeconds = this._audioContext.currentTime + delaySeconds
		this._attackEndTimeSeconds = this._attackStartTimeSeconds + attackTimeInSeconds

		this._disposeAudioBufferSource()
		this._audioBufferSource = this._audioContext.createBufferSource()
		this._audioBufferSource.buffer = SamplesManager.getSample(midiNoteToNoteName(note), getOctaveFromMidiNote(note))
		this._audioBufferSource.start(this._attackStartTimeSeconds)

		// logger.log(this.id + ' synth scheduleNote delaySeconds: ' + delaySeconds + ' | note: ' + note + ' | attackTimeInSeconds: ' + attackTimeInSeconds)

		this._gain = this._audioContext.createGain()
		this._gain.gain.value = 0
		this._gain.gain.linearRampToValueAtTime(0, this._attackStartTimeSeconds)
		this._gain.gain.linearRampToValueAtTime(this._sustainLevel, this._attackEndTimeSeconds)

		this._audioBufferSource.connect(this._gain)
			.connect(this._destination)
	}

	protected _playNote(note: number) {
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
