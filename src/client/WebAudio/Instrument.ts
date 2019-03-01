import {Map, OrderedMap} from 'immutable'
import uuid = require('uuid')
import {IDisposable} from '../../common/common-types'
import {emptyMidiNotes, IMidiNote, IMidiNotes} from '../../common/MidiNote'
import {BuiltInOscillatorType} from '../../common/OscillatorTypes'
import {AudioNodeWrapper, IAudioNodeWrapperOptions} from './index'
import {SamplerVoice} from './index'
import {SynthVoice} from './index'

export type VoiceCreator = (audioContext: AudioContext, destination: AudioNode, forScheduling: boolean) => Voice

export const samplerVoiceCreator: VoiceCreator = (context, destination, forScheduling) => {
	return new SamplerVoice(context, destination, forScheduling)
}

export const synthVoiceCreator: VoiceCreator = (context, destination, forScheduling) => {
	return new SynthVoice(context, destination, BuiltInOscillatorType.sawtooth, forScheduling, 0)
}

export enum InstrumentType {
	BasicSynthesizer,
	BasicSampler,
}

const voiceCreators = Map<InstrumentType, VoiceCreator>([
	[InstrumentType.BasicSynthesizer, synthVoiceCreator],
	[InstrumentType.BasicSampler, samplerVoiceCreator],
])

export class Instrument extends AudioNodeWrapper implements IDisposable {

	private readonly _voices: Voices
	private readonly _panNode: StereoPannerNode
	private readonly _lowPassFilter: BiquadFilterNode
	private readonly _gain: GainNode
	private _attackTimeInSeconds: number = 0.01
	private _releaseTimeInSeconds: number = 3
	private _previousNotes = emptyMidiNotes

	constructor(options: IInstrumentOptions) {
		super(options)

		this._panNode = this._audioContext.createStereoPanner()

		this._lowPassFilter = this._audioContext.createBiquadFilter()
		this._lowPassFilter.type = 'lowpass'
		this._lowPassFilter.frequency.value = 10000

		this._gain = this._audioContext.createGain()
		// Just below 1 to help mitigate an infinite feedback loop
		this._gain.gain.value = 0.999

		this._panNode.connect(this._lowPassFilter)
		this._lowPassFilter.connect(this._gain)

		const voiceCreator = voiceCreators.get(options.type)

		if (!voiceCreator) throw new Error('missing voice creator for type: ' + options.type)

		this._voices = new Voices(
			options.voiceCount,
			options.audioContext,
			this._panNode,
			voiceCreator,
		)
	}

	public scheduleNote(note: IMidiNote, delaySeconds: number) {
		this._voices.scheduleNote(note, delaySeconds, this._attackTimeInSeconds)
	}

	public scheduleRelease(note: number, delaySeconds: number) {
		this._voices.scheduleRelease(note, delaySeconds, this._releaseTimeInSeconds)
	}

	public readonly getInputAudioNode = () => null
	public readonly getOutputAudioNode = () => this._gain

	public readonly setPan = (pan: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newPan = Math.fround(pan)
		if (newPan === this._panNode.pan.value) return
		this._panNode.pan.setValueAtTime(newPan, this._audioContext.currentTime)
	}

	public readonly setLowPassFilterCutoffFrequency = (frequency: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newFreq = Math.fround(frequency)
		if (newFreq === this._lowPassFilter.frequency.value) return
		this._lowPassFilter.frequency.linearRampToValueAtTime(newFreq, this._audioContext.currentTime + 0.004)
	}

	// TODO Check if changed before iterating through previous notes
	public readonly setMidiNotes = (midiNotes: IMidiNotes) => {
		const newNotes = midiNotes.filter(x => this._previousNotes.includes(x) === false)
		const offNotes = this._previousNotes.filter(x => midiNotes.includes(x) === false)

		offNotes.forEach(note => {
			this._voices.releaseNote(note, this._releaseTimeInSeconds)
		})

		newNotes.forEach(note => {
			this._voices.playNote(note, this._attackTimeInSeconds)
		})

		this._previousNotes = midiNotes
	}

	public readonly setAttack = (attackTimeInSeconds: number) => this._attackTimeInSeconds = attackTimeInSeconds

	public readonly setRelease = (releaseTimeInSeconds: number) => this._releaseTimeInSeconds = releaseTimeInSeconds

	public readonly getActivityLevel = () => this._voices.getActivityLevel()

	public dispose = () => {
		this._voices.dispose()
		this._panNode.disconnect()
		this._gain.disconnect()
		this._lowPassFilter.disconnect()
	}
}

export interface IInstrumentOptions extends IAudioNodeWrapperOptions {
	voiceCount: number
	type: InstrumentType
}

export enum VoiceStatus {
	playing,
	releasing,
	off,
}

export class Voices {
	private _inactiveVoices = OrderedMap<number, Voice>()
	private _activeVoices = OrderedMap<number, Voice>()
	private _releasingVoices = OrderedMap<number, Voice>()
	private _scheduledVoices = OrderedMap<number, Voice>()

	constructor(
		private readonly _voiceCount: number,
		private readonly _audioContext: AudioContext,
		private readonly _destination: AudioNode,
		private readonly _voiceCreator: VoiceCreator,
	) {
		for (let i = 0; i < this._voiceCount; i++) {
			const newVoice = this._voiceCreator(this._audioContext, this._destination, false)
			this._inactiveVoices = this._inactiveVoices.set(newVoice.id, newVoice)
		}
	}

	protected get _allVoices() {
		return this._inactiveVoices
			.concat(this._activeVoices)
			.concat(this._releasingVoices)
			.concat(this._scheduledVoices)
	}

	public playNote(note: number, attackTimeInSeconds: number) {
		const voice = this._getVoice(note)

		voice.playNote(note, attackTimeInSeconds)
	}

	public releaseNote = (note: number, timeToReleaseInSeconds: number) => {
		const voice = this._activeVoices.find(x => x.playingNote === note)

		if (voice) {
			const releaseId = voice.release(timeToReleaseInSeconds)

			this._activeVoices = this._activeVoices.delete(voice.id)
			this._releasingVoices = this._releasingVoices.set(voice.id, voice)

			setTimeout(() => {
				const releasingVoice = this._releasingVoices.find(x => x.getReleaseId() === releaseId)
				if (releasingVoice) {
					this._releasingVoices = this._releasingVoices.filter(x => x.getReleaseId() !== releaseId)
					this._inactiveVoices = this._inactiveVoices.set(releasingVoice.id, releasingVoice)
				}
			}, timeToReleaseInSeconds * 1000)
		}
	}

	public scheduleNote(note: IMidiNote, delaySeconds: number, attackSeconds: number) {
		const newVoice = this._voiceCreator(this._audioContext, this._destination, true)

		newVoice.scheduleNote(note, attackSeconds, delaySeconds)

		this._scheduledVoices = this._scheduledVoices.set(newVoice.id, newVoice)
	}

	public scheduleRelease(note: number, delaySeconds: number, releaseSeconds: number) {
		const firstUnReleasedVoiceForNote = this._scheduledVoices
			.filter(x => x.playingNote === note)
			.find(x => x.getIsReleaseScheduled() === false)

		if (!firstUnReleasedVoiceForNote) {
			throw new Error('trying to schedule release for note, but no available note to release')
		}

		firstUnReleasedVoiceForNote.scheduleRelease(
			delaySeconds,
			releaseSeconds,
			() => (this._scheduledVoices = this._scheduledVoices.delete(firstUnReleasedVoiceForNote.id)),
		)
	}

	public getActivityLevel = () => {
		if (this._activeVoices.count() > 0) return 1
		if (this._releasingVoices.count() > 0) return 0.5
		return 0
	}

	public dispose() {
		this._allVoices.forEach(x => x.dispose())
	}

	protected _getVoice(note: number): Voice {
		// Look for active voice that is playing same note
		const sameNoteActiveVoice = this._activeVoices.find(x => x.playingNote === note)

		if (sameNoteActiveVoice) {
			this._activeVoices = this._activeVoices.filter(x => x !== sameNoteActiveVoice)
			this._activeVoices = this._activeVoices.set(sameNoteActiveVoice.id, sameNoteActiveVoice)
			return sameNoteActiveVoice
		}

		// Look for releasing voice that is playing same note
		const sameNoteReleasingVoice = this._releasingVoices.find(x => x.playingNote === note)

		if (sameNoteReleasingVoice) {
			this._releasingVoices = this._releasingVoices.filter(x => x !== sameNoteReleasingVoice)
			this._activeVoices = this._activeVoices.set(sameNoteReleasingVoice.id, sameNoteReleasingVoice)
			return sameNoteReleasingVoice
		}

		if (this._inactiveVoices.count() > 0) {
			// Try to return inactive voice first
			const voice = this._inactiveVoices.first() as Voice
			this._inactiveVoices = this._inactiveVoices.delete(voice.id)
			this._activeVoices = this._activeVoices.set(voice.id, voice)
			return voice
		} else if (this._releasingVoices.count() > 0) {
			// Next try releasing voices
			const voice = this._releasingVoices.first() as Voice
			this._releasingVoices = this._releasingVoices.delete(voice.id)
			this._activeVoices = this._activeVoices.set(voice.id, voice)
			return voice
		} else {
			// Lastly use active voices
			const voice = this._activeVoices.first() as Voice
			this._activeVoices = this._activeVoices.delete(voice.id).set(voice.id, voice)
			return voice
		}
	}
}

export abstract class Voice {

	protected static _nextId = 0
	public playingNote: number = -1
	public playStartTime: number = 0
	public readonly id: number
	protected _audioContext: AudioContext
	protected _destination: AudioNode
	protected _releaseId: string = ''
	protected _status: VoiceStatus = VoiceStatus.off
	protected _gain: GainNode
	protected _isReleaseScheduled = false
	protected _attackStartTimeSeconds = 0.005
	protected _attackEndTimeSeconds = 0
	protected _sustainLevel = 1

	constructor(audioContext: AudioContext, destination: AudioNode) {
		this.id = Voice._nextId++
		this._audioContext = audioContext
		this._destination = destination

		this._gain = this._audioContext.createGain()
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime)
	}

	public getReleaseId = () => this._releaseId

	public abstract playNote(note: number, attackTimeInSeconds: number): void

	public scheduleNote(note: number, attackTimeInSeconds: number, delaySeconds: number) {
		// if delay is 0 then the scheduler isn't working properly
		if (delaySeconds < 0) throw new Error('delay <= 0: ' + delaySeconds)

		this._scheduleNote(note, attackTimeInSeconds, delaySeconds)

		this.playingNote = note
	}

	public release = (timeToReleaseInSeconds: number) => {
		this._cancelAndHoldOrJustCancel()
		this._gain.gain.setValueAtTime(this._gain.gain.value, this._audioContext.currentTime)
		this._gain.gain.exponentialRampToValueAtTime(0.00001, this._audioContext.currentTime + timeToReleaseInSeconds)
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime + timeToReleaseInSeconds)

		this._status = VoiceStatus.releasing
		this._releaseId = uuid.v4()
		return this._releaseId
	}

	public getIsReleaseScheduled = () => this._isReleaseScheduled

	public abstract dispose(): void

	public abstract scheduleRelease(delaySeconds: number, releaseSeconds: number, onEnded: () => void): void

	protected abstract _scheduleNote(note: number, attackTimeInSeconds: number, delaySeconds: number): void

	protected _scheduleReleaseNormalNoteGeneric(
		delaySeconds: number,
		releaseSeconds: number,
		audioNode: AudioScheduledSourceNode | undefined,
		onEnded: () => void,
	) {
		const releaseStartTimeSeconds = this._audioContext.currentTime + delaySeconds
		const stopTimeSeconds = this._audioContext.currentTime + delaySeconds + releaseSeconds

		// logger.log(this.id + ' synth scheduleRelease delay: ' + delaySeconds + ' | release: ' + releaseSeconds + ' | stop: ' + stopTimeSeconds)

		if (this._attackEndTimeSeconds < releaseStartTimeSeconds) {
			// if attack is short, do linear ramp to sustain with no cancel
			this._gain.gain.linearRampToValueAtTime(this._sustainLevel, releaseStartTimeSeconds)
		} else {
			// if attack is long, cancel and hold, calculate target sustain, and continue ramping to it
			this._cancelAndHoldOrJustCancel()
			// for linear attack only, need different math for other attack curves
			const originalAttackLength = this._attackEndTimeSeconds - this._attackStartTimeSeconds
			const newAttackLength = releaseStartTimeSeconds - this._attackStartTimeSeconds
			const ratio = newAttackLength / originalAttackLength
			const targetSustainAtReleaseStart = ratio * this._sustainLevel
			this._gain.gain.linearRampToValueAtTime(targetSustainAtReleaseStart, releaseStartTimeSeconds)
		}

		this._gain.gain.exponentialRampToValueAtTime(0.00001, stopTimeSeconds)

		if (!audioNode) return
		audioNode.stop(stopTimeSeconds)
		audioNode.onended = () => {
			audioNode!.disconnect()
			this._gain.disconnect()
			delete this._gain
			onEnded()
		}
	}

	protected _beforePlayNote(attackTimeInSeconds: number) {
		this._cancelAndHoldOrJustCancel()

		// Never go straight to 0 or you'll probably get a click sound
		this._gain.gain.linearRampToValueAtTime(0, this._audioContext.currentTime + 0.001)

		// this._gain.gain.setValueAtTime(0, this._audioContext.currentTime)
		this._gain.gain.linearRampToValueAtTime(this._sustainLevel, this._audioContext.currentTime + attackTimeInSeconds)
	}

	protected _afterPlayNote(note: number) {
		this.playStartTime = this._audioContext.currentTime
		this.playingNote = note
		this._status = VoiceStatus.playing
	}

	protected _dispose() {
		this._gain.disconnect()
		delete this._gain
	}

	protected readonly _cancelAndHoldOrJustCancel = (delaySeconds = 0) => {
		const gain = this._gain.gain as any

		const cancelTimeSeconds = this._audioContext.currentTime + delaySeconds

		// cancelAndHoldAtTime is not implemented in firefox
		if (gain.cancelAndHoldAtTime) {
			gain.cancelAndHoldAtTime(cancelTimeSeconds)
		} else {
			gain.cancelScheduledValues(cancelTimeSeconds)
		}
	}
}
