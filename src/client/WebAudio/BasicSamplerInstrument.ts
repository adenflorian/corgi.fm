import {logger} from '../../common/logger'
import {IMidiNote} from '../../common/MidiNote'
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

	public scheduleNote(note: IMidiNote, delaySeconds: number) {
		this._voices.scheduleNote(note, delaySeconds, this._attackTimeInSeconds, this._audioContext, this._panNode)
	}

	public scheduleRelease(note: number, delaySeconds: number) {
		this._voices.scheduleRelease(note, delaySeconds, this._releaseTimeInSeconds)
	}

	public dispose = () => {
		this._voices.dispose()

		this._dispose()
	}

	protected _getVoices = () => this._voices
}

class SamplerVoices extends Voices<SamplerVoice> {
	public static createVoice(
		audioContext: AudioContext, destination: AudioNode,
		forScheduling: boolean,
	) {
		return new SamplerVoice(audioContext, destination, forScheduling)
	}

	constructor(voiceCount: number, audioContext: AudioContext, destination: AudioNode) {
		super()

		for (let i = 0; i < voiceCount; i++) {
			const newVoice = SamplerVoices.createVoice(audioContext, destination, false)
			this._inactiveVoices = this._inactiveVoices.set(newVoice.id, newVoice)
		}
	}

	public scheduleNote(note: IMidiNote, delaySeconds: number, attackTimeInSeconds: number, audioContext: AudioContext, destination: AudioNode) {
		const newVoice = SamplerVoices.createVoice(audioContext, destination, true)

		newVoice.scheduleNote(note, attackTimeInSeconds, delaySeconds)

		this._scheduledVoices = this._scheduledVoices.set(newVoice.id, newVoice)
	}

	public scheduleRelease(note: number, delaySeconds: number, releaseSeconds: number) {
		const firstUnReleasedVoiceForNote = this._scheduledVoices
			.filter(x => x.playingNote === note)
			.find(x => x.getIsReleaseScheduled() === false)

		if (!firstUnReleasedVoiceForNote) throw new Error('trying to schedule release for note, but no available note to release')

		firstUnReleasedVoiceForNote.scheduleRelease(
			delaySeconds,
			releaseSeconds,
			() => (this._scheduledVoices = this._scheduledVoices.delete(firstUnReleasedVoiceForNote.id)),
		)
	}
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

	public getIsReleaseScheduled = () => this._isReleaseScheduled

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
