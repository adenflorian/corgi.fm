import {OrderedMap} from 'immutable'
import uuid = require('uuid')
import {IDisposable} from '../../common/common-types'
import {logger} from '../../common/logger'
import {emptyMidiNotes, IMidiNote, IMidiNotes} from '../../common/MidiNote'
import {AudioNodeWrapper, IAudioNodeWrapperOptions} from './index'
import {updateSchedulerVisual} from './SchedulerVisual'

export abstract class Instrument<T extends Voices<V>, V extends Voice> extends AudioNodeWrapper implements IDisposable {

	protected readonly _panNode: StereoPannerNode
	protected readonly _audioContext: AudioContext
	protected readonly _lowPassFilter: BiquadFilterNode
	protected _attackTimeInSeconds: number = 0.01
	protected _releaseTimeInSeconds: number = 3
	private readonly _gain: GainNode
	private _previousNotes = emptyMidiNotes

	constructor(options: IInstrumentOptions) {
		super(options)

		this._audioContext = options.audioContext

		this._panNode = this._audioContext.createStereoPanner()

		this._lowPassFilter = this._audioContext.createBiquadFilter()
		this._lowPassFilter.type = 'lowpass'
		this._lowPassFilter.frequency.value = 10000

		this._gain = this._audioContext.createGain()
		// Just below 1 to help mitigate an infinite feedback loop
		this._gain.gain.value = 0.999

		this._panNode.connect(this._lowPassFilter)
		this._lowPassFilter.connect(this._gain)

		registerInstrumentWithSchedulerVisual(this.id, () => this._getVoices().getScheduledVoices(), this._audioContext)
	}

	public scheduleNote(note: IMidiNote, delaySeconds: number) {
		this._getVoices().scheduleNote(note, delaySeconds, this._attackTimeInSeconds)
	}

	public scheduleRelease(note: number, delaySeconds: number) {
		this._getVoices().scheduleRelease(note, delaySeconds, this._releaseTimeInSeconds)
	}

	public releaseAllScheduled() {
		this._getVoices().releaseAllScheduled(this._releaseTimeInSeconds)
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
			this._getVoices().releaseNote(note, this._releaseTimeInSeconds)
		})

		newNotes.forEach(note => {
			this._getVoices().playNote(note, this._attackTimeInSeconds)
		})

		this._previousNotes = midiNotes
	}

	public readonly setAttack = (attackTimeInSeconds: number) => this._attackTimeInSeconds = attackTimeInSeconds

	public readonly setRelease = (releaseTimeInSeconds: number) => this._releaseTimeInSeconds = releaseTimeInSeconds

	public readonly getActivityLevel = () => this._getVoices().getActivityLevel()

	public dispose = () => {
		this._getVoices().dispose()

		this._dispose()
	}

	protected _dispose = () => {
		this._panNode.disconnect()
		this._gain.disconnect()
		this._lowPassFilter.disconnect()
	}

	protected abstract _getVoices(): T
}

export interface IInstrumentOptions extends IAudioNodeWrapperOptions {
	voiceCount: number
}

export enum VoiceStatus {
	playing,
	releasing,
	off,
}

export abstract class Voices<V extends Voice> {
	protected _inactiveVoices = OrderedMap<number, V>()
	protected _activeVoices = OrderedMap<number, V>()
	protected _releasingVoices = OrderedMap<number, V>()
	protected _scheduledVoices = OrderedMap<number, V>()

	protected get _allVoices() {
		return this._inactiveVoices
			.concat(this._activeVoices)
			.concat(this._releasingVoices)
			.concat(this._scheduledVoices)
	}

	public getScheduledVoices() {return this._scheduledVoices}

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

	public abstract createVoice(forScheduling: boolean): V

	public scheduleNote(note: IMidiNote, delaySeconds: number, attackTimeInSeconds: number) {

		const newNoteStartTime = this._getAudioContext().currentTime + delaySeconds

		// check for any scheduled notes playing same note that will overlap
		// if new note start is in middle of existing note, then schedule hard cutoff of existing note
		//   or schedule new attack on existing voice
		const scheduledVoicesSameNote = this._scheduledVoices.filter(x => x.playingNote === note)

		// Its only possible for there to be one conflicting voice, because of this function

		const conflictingVoice = scheduledVoicesSameNote.find(
			x => x.getScheduledAttackStartTime() <= newNoteStartTime && newNoteStartTime < x.getScheduledReleaseEndTimeSeconds())

		if (conflictingVoice) {
			// logger.log('conflictingVoice')
			if (conflictingVoice.getScheduledAttackStartTime() === newNoteStartTime) return

			// schedule hard cutoff of existing note
			conflictingVoice.scheduleRelease(delaySeconds, 0.001, this._getOnEndedCallback(conflictingVoice.id))
		}

		// Need to do something if new note starts before all scheduled notes
		// need to schedule a release for it immediately

		// I should probably keep one voice per note

		// logger.log('[scheduleNote] ' + this.id + ' synth scheduleNote delaySeconds: ' + delaySeconds + ' | note: ' + note + ' | attackTimeInSeconds: ' + attackTimeInSeconds)
		const newVoice = this.createVoice(true)

		newVoice.scheduleNote(note, attackTimeInSeconds, delaySeconds)

		this._scheduledVoices = this._scheduledVoices.set(newVoice.id, newVoice)

		// Check if any scheduled voices start after this new note
		const voicesAfter = scheduledVoicesSameNote.filter(x => x.getScheduledAttackStartTime() > newNoteStartTime)

		if (voicesAfter.count() > 0) {
			// logger.log('scheduling hard cutoff for new note because it is behind a future note. newVoice: ', newVoice)
			const closestScheduledStart = voicesAfter.map(x => x.getScheduledAttackStartTime()).min()
			if (closestScheduledStart === undefined) throw new Error('shouldnt happen i think')

			newVoice.scheduleRelease(
				closestScheduledStart - this._getAudioContext().currentTime,
				0.001,
				this._getOnEndedCallback(newVoice.id),
			)
		}
	}

	public scheduleRelease(note: number, delaySeconds: number, releaseSeconds: number) {
		const currentTime = this._getAudioContext().currentTime

		const releaseStartTime = currentTime + delaySeconds

		// Find scheduled voice that will be playing at releaseStartTime
		const scheduledVoicesSameNote = this._scheduledVoices.filter(x => x.playingNote === note)

		// Its only possible for there to be one conflicting voice, because of this function
		const voiceToRelease = scheduledVoicesSameNote.find(
			x => x.getScheduledAttackStartTime() <= releaseStartTime && releaseStartTime < x.getScheduledReleaseEndTimeSeconds())

		if (voiceToRelease) {
			// logger.log('found voiceToRelease: ', voiceToRelease)
			if (voiceToRelease.getScheduledAttackStartTime() === releaseStartTime) return

			voiceToRelease.scheduleRelease(delaySeconds, releaseSeconds, this._getOnEndedCallback(voiceToRelease.id))

			// logger.log('[scheduleRelease] note: ' + note + ' | this._scheduledVoices: ', this._scheduledVoices)

			// Check if release crosses into another voice
			// Check same note voices, where voice attack start is in our release window
			const conflictingVoice = scheduledVoicesSameNote.find(
				x => releaseStartTime <= x.getScheduledAttackStartTime() && x.getScheduledAttackStartTime() < releaseStartTime + releaseSeconds)

			if (conflictingVoice) {
				// logger.log('conflictingVoice in release window, conflictingVoice: ', conflictingVoice)
				// schedule hard cutoff on voiceToRelease
				const hardCutoffDelay = conflictingVoice.getScheduledAttackStartTime() - currentTime
				voiceToRelease.scheduleRelease(hardCutoffDelay, 0.001, this._getOnEndedCallback(voiceToRelease.id))
			}
		} else {

			// logger.log('[scheduleRelease] no matching voice to release, note: ', note)
		}
	}

	public releaseAllScheduled(releaseSeconds: number) {
		this._scheduledVoices.forEach(x => {
			x.scheduleRelease(0, releaseSeconds, this._getOnEndedCallback(x.id), true)
		})
	}

	public getActivityLevel = () => {
		if (this._activeVoices.count() > 0) return 1
		if (this._releasingVoices.count() > 0) return 0.5
		return 0
	}

	public dispose() {
		this._allVoices.forEach(x => x.dispose())
	}

	protected abstract _getAudioContext(): AudioContext

	protected _getVoice(note: number): V {
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
			const voice = this._inactiveVoices.first() as V
			this._inactiveVoices = this._inactiveVoices.delete(voice.id)
			this._activeVoices = this._activeVoices.set(voice.id, voice)
			return voice
		} else if (this._releasingVoices.count() > 0) {
			// Next try releasing voices
			const voice = this._releasingVoices.first() as V
			this._releasingVoices = this._releasingVoices.delete(voice.id)
			this._activeVoices = this._activeVoices.set(voice.id, voice)
			return voice
		} else {
			// Lastly use active voices
			const voice = this._activeVoices.first() as V
			this._activeVoices = this._activeVoices.delete(voice.id).set(voice.id, voice)
			return voice
		}
	}

	private _getOnEndedCallback(id: number) {
		return () => (this._scheduledVoices = this._scheduledVoices.delete(id))
	}
}

export abstract class Voice {

	protected static _nextId = 0
	public readonly id: number
	public playingNote: number = -1
	public playStartTime: number = 0
	protected _audioContext: AudioContext
	protected _destination: AudioNode
	protected _releaseId: string = ''
	protected _status: VoiceStatus = VoiceStatus.off
	protected _gain: GainNode
	protected _isReleaseScheduled = false
	protected _scheduledAttackStartTimeSeconds = 0
	protected _scheduledAttackEndTimeSeconds = 0
	protected _scheduledSustainAtAttackEnd = 1
	protected _scheduledSustainAtReleaseStart = 1
	protected _scheduledSustainAtReleaseEnd = 0
	protected _scheduledReleaseStartTimeSeconds = Number.MAX_VALUE
	protected _scheduledReleaseEndTimeSeconds = Number.MAX_VALUE
	protected _sustainLevel = 1

	constructor(audioContext: AudioContext, destination: AudioNode) {
		this.id = Voice._nextId++
		this._audioContext = audioContext
		this._destination = destination

		this._gain = this._audioContext.createGain()
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime)
	}

	public getScheduledAttackStartTime = () => this._scheduledAttackStartTimeSeconds
	public getScheduledAttackEndTime = () => this._scheduledAttackEndTimeSeconds
	public getScheduledSustainAtAttackEnd = () => this._scheduledSustainAtAttackEnd
	public getScheduledSustainAtReleaseStart = () => this._scheduledSustainAtReleaseStart
	public getScheduledSustainAtReleaseEnd = () => this._scheduledSustainAtReleaseEnd
	public getScheduledReleaseStartTimeSeconds = () => this._scheduledReleaseStartTimeSeconds
	public getScheduledReleaseEndTimeSeconds = () => this._scheduledReleaseEndTimeSeconds

	public getIsReleaseScheduled = () => this._isReleaseScheduled

	public getReleaseId = () => this._releaseId

	public abstract playNote(note: number, attackTimeInSeconds: number): void

	public release = (timeToReleaseInSeconds: number) => {
		this._cancelAndHoldOrJustCancelAtTime()
		this._gain.gain.setValueAtTime(this._gain.gain.value, this._audioContext.currentTime)
		this._gain.gain.exponentialRampToValueAtTime(0.00001, this._audioContext.currentTime + timeToReleaseInSeconds)
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime + timeToReleaseInSeconds)

		this._status = VoiceStatus.releasing
		this._releaseId = uuid.v4()
		return this._releaseId
	}

	public abstract scheduleNote(note: number, attackTimeInSeconds: number, delaySeconds: number): void

	public abstract getAudioNodeToStop(): AudioScheduledSourceNode | undefined

	public scheduleRelease(
		delaySeconds: number,
		releaseSeconds: number,
		onEnded: () => void,
		releaseIfNotCurrentlyReleasing = false,
	) {
		const audioNode = this.getAudioNodeToStop()

		if (this._isReleaseScheduled) {

			// trying to re-release a voice
			// new release start time must be between original attack start and release end
			// is new release start before or after original release start?
			// if after, then assume hard cutoff
			// if before, need to redo all release stuff
			const newReleaseStartTime = this._audioContext.currentTime + delaySeconds

			if (newReleaseStartTime >= this._scheduledReleaseStartTimeSeconds) {

				if (releaseIfNotCurrentlyReleasing) return

				// This means its a hard cutoff in the middle of a releasing voice
				//   because another voice is starting on same note
				// logger.log('!!! newReleaseStartTime >= this._scheduledReleaseStartTimeSeconds')
				// logger.log('!!! newReleaseStartTime: ', newReleaseStartTime)
				// logger.log('!!! this._scheduledReleaseStartTimeSeconds: ', this._scheduledReleaseStartTimeSeconds)

				const originalReleaseEndTime = this._scheduledReleaseEndTimeSeconds
				const originalReleaseLength = originalReleaseEndTime - this._scheduledReleaseStartTimeSeconds
				// logger.log('this._scheduledReleaseStartTimeSeconds: ', this._scheduledReleaseStartTimeSeconds)
				// logger.log('originalReleaseEndTime: ', originalReleaseEndTime)

				this._scheduledReleaseEndTimeSeconds = this._audioContext.currentTime + delaySeconds + releaseSeconds
				// logger.log('this._scheduledReleaseEndTimeSeconds: ', this._scheduledReleaseEndTimeSeconds)

				const newReleaseLength = this._scheduledReleaseEndTimeSeconds - this._scheduledReleaseStartTimeSeconds
				const ratio = newReleaseLength / originalReleaseLength
				// Not accurate for a curved release, will be too high
				this._scheduledSustainAtReleaseEnd = this._scheduledSustainAtReleaseStart - (ratio * this._scheduledSustainAtReleaseStart)
				// logger.log('this._scheduledSustainAtReleaseStart: ', this._scheduledSustainAtReleaseStart)
				// logger.log('ratio: ', ratio)
				// logger.log('newReleaseLength: ', newReleaseLength)
				// logger.log('originalReleaseLength: ', originalReleaseLength)
				// logger.log('this._scheduledSustainAtReleaseEnd: ', this._scheduledSustainAtReleaseEnd)

				if (!audioNode) return
				audioNode.stop(this._scheduledReleaseEndTimeSeconds)
				return
			} else {
				// Let it do normal release stuff
			}
		} else {
			this._isReleaseScheduled = true
		}

		// every time we release

		this._scheduledReleaseStartTimeSeconds = this._audioContext.currentTime + delaySeconds
		this._scheduledReleaseEndTimeSeconds = this._audioContext.currentTime + delaySeconds + releaseSeconds

		// logger.log('synth scheduleRelease', {
		// 	id: this.id,
		// 	delaySeconds,
		// 	releaseSeconds,
		// 	_scheduledReleaseStartTimeSeconds: this._scheduledReleaseStartTimeSeconds,
		// 	_scheduledReleaseEndTimeSeconds: this._scheduledReleaseEndTimeSeconds,
		// })

		// If cancelAndHold is called with a past time it doesn't work
		this._cancelAndHoldOrJustCancelAtTime(
			releaseIfNotCurrentlyReleasing
				? undefined
				: Math.max(this._audioContext.currentTime + 0.0001, this._scheduledReleaseStartTimeSeconds),
		)
		if (this._scheduledAttackEndTimeSeconds < this._scheduledReleaseStartTimeSeconds) {
			// if release start is during sustain
			this._gain.gain.linearRampToValueAtTime(this._scheduledSustainAtAttackEnd, this._scheduledReleaseStartTimeSeconds)
		} else {
			// if release start is during attack, cancel and hold, calculate target sustain, and continue ramping to it
			// TODO This is assuming that it is currently in attack
			// for linear attack only, need different math for other attack curves
			const originalAttackLength = this._scheduledAttackEndTimeSeconds - this._scheduledAttackStartTimeSeconds
			const newAttackLength = this._scheduledReleaseStartTimeSeconds - this._scheduledAttackStartTimeSeconds
			const ratio = newAttackLength / originalAttackLength
			const targetSustainAtReleaseStart = ratio * this._scheduledSustainAtAttackEnd
			// this._gain.gain.linearRampToValueAtTime(targetSustainAtReleaseStart, this._scheduledReleaseStartTimeSeconds)

			this._scheduledAttackEndTimeSeconds = this._scheduledReleaseStartTimeSeconds
			this._scheduledSustainAtAttackEnd = targetSustainAtReleaseStart
			this._scheduledSustainAtReleaseStart = targetSustainAtReleaseStart
			// logger.log('AAA: ', {
			// 	releaseSeconds,
			// 	originalAttackLength,
			// 	newAttackLength,
			// 	ratio,
			// 	targetSustainAtReleaseStart,
			// })
		}

		this._gain.gain.exponentialRampToValueAtTime(0.00001, this._scheduledReleaseEndTimeSeconds)

		if (!audioNode) return
		audioNode.stop(this._scheduledReleaseEndTimeSeconds)
		audioNode.onended = () => {
			audioNode!.disconnect()
			this._gain.disconnect()
			delete this._gain
			onEnded()
		}
	}

	public abstract dispose(): void

	protected _beforePlayNote(attackTimeInSeconds: number) {
		this._cancelAndHoldOrJustCancelAtTime()

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

	protected readonly _cancelAndHoldOrJustCancelAtTime = (time = this._audioContext.currentTime) => {
		const gain = this._gain.gain as any

		// cancelAndHoldAtTime is not implemented in firefox
		if (gain.cancelAndHoldAtTime) {
			gain.cancelAndHoldAtTime(time)
		} else {
			gain.cancelScheduledValues(time)
		}
	}
}
