import {logger} from '../../common/logger'
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
		return new SamplerVoice(this._audioContext, this._destination, forScheduling)
	}

	protected _getAudioContext() {return this._audioContext}
}

class SamplerVoice extends Voice {
	private _audioBufferSource: AudioBufferSourceNode | undefined

	constructor(audioContext: AudioContext, destination: AudioNode, forScheduling: boolean) {
		super(audioContext, destination)

		this._gain.connect(this._destination)
	}

	public playNote(note: number, attackTimeInSeconds: number) {
		this._beforePlayNote(attackTimeInSeconds)

		this._playSamplerNote(note)

		this._afterPlayNote(note)
	}

	public scheduleNote(note: number, attackTimeInSeconds: number, delaySeconds: number): void {
		// if delay is 0 then the scheduler isn't working properly
		if (delaySeconds < 0) throw new Error('delay <= 0: ' + delaySeconds)

		this._scheduleNormalNote(note, attackTimeInSeconds, delaySeconds)

		this.playingNote = note
	}

	public scheduleRelease(delaySeconds: number, releaseSeconds: number, onEnded: () => void) {
		this._scheduleReleaseNormalNote(delaySeconds, releaseSeconds, onEnded)

		this._isReleaseScheduled = true
	}

	public dispose() {
		this._disposeAudioBufferSource()
		this._dispose()
	}

	private _scheduleNormalNote(note: number, attackTimeInSeconds: number, delaySeconds: number): void {
		this._scheduledAttackStartTimeSeconds = this._audioContext.currentTime + delaySeconds
		this._scheduledAttackEndTimeSeconds = this._scheduledAttackStartTimeSeconds + attackTimeInSeconds

		this._disposeAudioBufferSource()
		this._audioBufferSource = this._audioContext.createBufferSource()
		this._audioBufferSource.buffer = SamplesManager.getSample(midiNoteToNoteName(note), getOctaveFromMidiNote(note))
		this._audioBufferSource.start(this._scheduledAttackStartTimeSeconds)

		// logger.log(this.id + ' synth scheduleNote delaySeconds: ' + delaySeconds + ' | note: ' + note + ' | attackTimeInSeconds: ' + attackTimeInSeconds)

		this._gain = this._audioContext.createGain()
		this._gain.gain.value = 0
		this._gain.gain.linearRampToValueAtTime(0, this._scheduledAttackStartTimeSeconds)
		this._gain.gain.linearRampToValueAtTime(this._sustainLevel, this._scheduledAttackEndTimeSeconds)

		this._audioBufferSource.connect(this._gain)
			.connect(this._destination)
	}

	private _scheduleReleaseNormalNote(delaySeconds: number, releaseSeconds: number, onEnded: () => void) {
		this._scheduleReleaseNormalNoteGeneric(delaySeconds, releaseSeconds, this._audioBufferSource, onEnded)
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
