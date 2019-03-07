import {Record} from 'immutable'
import {number} from 'prop-types'
import uuid = require('uuid')
import {logger} from '../../common/logger'
import {OnEndedCallback} from './index'

enum VoiceStatus {
	playing,
	releasing,
	off,
}

export abstract class Voice {

	protected static _nextId = 0
	public readonly id: number
	public playingNote: number = -1
	public playStartTime: number = 0
	protected readonly _onEnded: OnEndedCallback
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
	protected _scheduledEnvelope = new ScheduledEnvelope()

	constructor(audioContext: AudioContext, destination: AudioNode, onEnded: OnEndedCallback) {
		this.id = Voice._nextId++
		this._audioContext = audioContext
		this._destination = destination
		this._onEnded = onEnded

		this._gain = this._audioContext.createGain()
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime)
	}

	public get scheduledAttackStartTime() {return this._scheduledAttackStartTimeSeconds}
	public get scheduledAttackEndTime() {return this._scheduledAttackEndTimeSeconds}
	public get scheduledSustainAtAttackEnd() {return this._scheduledSustainAtAttackEnd}
	public get scheduledSustainAtReleaseStart() {return this._scheduledSustainAtReleaseStart}
	public get scheduledSustainAtReleaseEnd() {return this._scheduledSustainAtReleaseEnd}
	public get scheduledReleaseStartTimeSeconds() {return this._scheduledReleaseStartTimeSeconds}
	public get scheduledReleaseEndTimeSeconds() {return this._scheduledReleaseEndTimeSeconds}
	public get scheduledEnvelope() {return this._scheduledEnvelope}

	public getIsReleaseScheduled = () => this._isReleaseScheduled

	public getReleaseId = () => this._releaseId

	public abstract getAudioScheduledSourceNode(): AudioScheduledSourceNode | undefined

	public abstract playNote(note: number, attackTimeInSeconds: number): void

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

	public release(timeToReleaseInSeconds: number) {
		this._cancelAndHoldOrJustCancelAtTime()
		this._gain.gain.setValueAtTime(this._gain.gain.value, this._audioContext.currentTime)
		this._gain.gain.exponentialRampToValueAtTime(0.00001, this._audioContext.currentTime + timeToReleaseInSeconds)
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime + timeToReleaseInSeconds)

		this._status = VoiceStatus.releasing
		this._releaseId = uuid.v4()
		return this._releaseId
	}

	public scheduleNote(note: number, attackTimeInSeconds: number, delaySeconds: number): void {
		// if delay is 0 then the scheduler isn't working properly
		if (delaySeconds < 0) throw new Error('delay <= 0: ' + delaySeconds)

		this._scheduleNoteSpecific(note)

		this.getAudioScheduledSourceNode()!.connect(this._gain)
			.connect(this._destination)

		this.playingNote = note

		this._scheduledEnvelope = new ScheduledEnvelope(
			this._audioContext.currentTime + delaySeconds,
			Number.MAX_VALUE,
			Number.MAX_VALUE,
			attackTimeInSeconds,
			this._sustainLevel,
			Number.MAX_VALUE,
		)

		this._scheduledAttackStartTimeSeconds = this._scheduledEnvelope.attackStart
		this._scheduledAttackEndTimeSeconds = this._scheduledEnvelope.attackEnd

		_applyEnvelope(
			this._scheduledEnvelope,
			this._gain,
			this.getAudioScheduledSourceNode()!,
			this._audioContext,
			true,
			() => this._onEnded(this.id),
		)
	}

	protected abstract _scheduleNoteSpecific(note: number): void

	public scheduleRelease(
		delaySeconds: number,
		releaseSeconds: number,
		releaseIfNotCurrentlyReleasing = false,
	) {
		const audioNode = this.getAudioScheduledSourceNode()!

		if (this._isReleaseScheduled) {
			// trying to re-release a voice
			// new release start time must be between original attack start and release end
			// is new release start before or after original release start?
			// if after, then assume hard cutoff
			// if before, need to redo all release stuff
			const newReleaseStartTime = this._audioContext.currentTime + delaySeconds

			if (newReleaseStartTime >= this._scheduledReleaseStartTimeSeconds) {

				if (releaseIfNotCurrentlyReleasing) return

				const originalReleaseEndTime = this._scheduledReleaseEndTimeSeconds
				const originalReleaseLength = originalReleaseEndTime - this._scheduledReleaseStartTimeSeconds

				this._scheduledReleaseEndTimeSeconds = this._audioContext.currentTime + delaySeconds + releaseSeconds

				const newReleaseLength = this._scheduledReleaseEndTimeSeconds - this._scheduledReleaseStartTimeSeconds
				const ratio = newReleaseLength / originalReleaseLength
				// Not accurate for a curved release, will be too high
				this._scheduledSustainAtReleaseEnd = this._scheduledSustainAtReleaseStart - (ratio * this._scheduledSustainAtReleaseStart)

				audioNode.stop(this._scheduledReleaseEndTimeSeconds)
				return
			} else {
				// Let it do normal release stuff
			}
		} else {
			this._isReleaseScheduled = true
		}

		this._scheduledReleaseStartTimeSeconds = this._audioContext.currentTime + delaySeconds
		this._scheduledReleaseEndTimeSeconds = this._audioContext.currentTime + delaySeconds + releaseSeconds

		this._cancelAndHoldOrJustCancelAtTime(
			releaseIfNotCurrentlyReleasing
				? undefined
				: Math.max(this._audioContext.currentTime + 0.0001, this._scheduledReleaseStartTimeSeconds),
		)

		const releaseStartIsDuringAttack = this._scheduledReleaseStartTimeSeconds <= this._scheduledAttackEndTimeSeconds

		if (releaseStartIsDuringAttack) {
			// for linear attack only, need different math for other attack curves
			const originalAttackLength = this._scheduledAttackEndTimeSeconds - this._scheduledAttackStartTimeSeconds
			const newAttackLength = this._scheduledReleaseStartTimeSeconds - this._scheduledAttackStartTimeSeconds
			const ratio = newAttackLength / originalAttackLength
			const targetSustainAtReleaseStart = ratio * this._scheduledSustainAtAttackEnd

			this._scheduledAttackEndTimeSeconds = this._scheduledReleaseStartTimeSeconds
			this._scheduledSustainAtAttackEnd = targetSustainAtReleaseStart
			this._scheduledSustainAtReleaseStart = targetSustainAtReleaseStart
		} else {
			this._gain.gain.linearRampToValueAtTime(this._scheduledSustainAtAttackEnd, this._scheduledReleaseStartTimeSeconds)
		}

		this._gain.gain.exponentialRampToValueAtTime(0.00001, this._scheduledReleaseEndTimeSeconds)

		audioNode.stop(this._scheduledReleaseEndTimeSeconds)
		audioNode.onended = () => {
			audioNode.disconnect()
			this._gain.disconnect()
			delete this._gain
			this._onEnded(this.id)
		}
	}

	public changeScheduledAttack(newAttackSeconds: number) {
		/*
		cases:
			- before attack
				- reschedule everything
			- during attack
				- reschedule everything
			- after attack
				- ignore

		will it matter if release has already been scheduled? 🤷‍

		maybe I should make a separate envelope class

		or a function to apply envelope to a gain and scheduled source node
		*/

		// If attack already finished
		if (this.scheduledAttackEndTime < this._audioContext.currentTime) return

	}

	public abstract dispose(): void

	protected _dispose() {
		this._gain.disconnect()
		delete this._gain
	}

	/** If cancelAndHold is called with a past time it doesn't work */
	protected _cancelAndHoldOrJustCancelAtTime(time = this._audioContext.currentTime) {
		const gain = this._gain.gain as any

		// cancelAndHoldAtTime is not implemented in firefox
		if (gain.cancelAndHoldAtTime) {
			gain.cancelAndHoldAtTime(time)
		} else {
			gain.cancelScheduledValues(time)
		}
	}
}

function _applyEnvelope(
	envelope: ScheduledEnvelope,
	gain: GainNode,
	sourceNode: AudioScheduledSourceNode,
	audioContext: AudioContext,
	startSource: boolean,
	onEnded: () => void,
) {
	// TODO If need to change start time of a note that's already scheduled
	//   you have to trash the old oscillator and make a new one
	//   can't call start more than once

	// attack start
	gain.gain.cancelScheduledValues(audioContext.currentTime)
	gain.gain.value = 0
	gain.gain.linearRampToValueAtTime(0, envelope.attackStart)
	// Before doing this, make sure we took everything else into account that we need to
	// - [√] releaseStart
	// - [ ] hardcutoff

	const actualAttackEnd = Math.min(envelope.attackEnd, envelope.releaseStart)

	const originalAttackLength = actualAttackEnd - envelope.attackStart
	const actualAttackLength = envelope.releaseStart - envelope.attackStart
	const ratio = actualAttackLength / originalAttackLength
	const adjustedSustain = ratio * envelope.sustain

	const actualSustain = Math.min(envelope.sustain, adjustedSustain)

	gain.gain.linearRampToValueAtTime(actualSustain, actualAttackEnd)

	if (startSource) {
		sourceNode.start(envelope.attackStart)
	}

	// TODO Handle cutoff attack and cutoff release

	// attack end
	gain.gain.linearRampToValueAtTime(envelope.sustain, envelope.releaseStart)

	// release start
	gain.gain.exponentialRampToValueAtTime(0.00001, envelope.releaseEnd)

	// release end
	sourceNode.stop(envelope.releaseEnd)
	sourceNode.onended = onEnded
}

// const makeScheduledEnvelope = Record({
// 	attackStart: 0,
// 	releaseStart: 0,
// 	hardCutoffTime: 0,
// 	attackLength: 0.005,
// 	// decay: 0.0,
// 	sustain: 1.0,
// 	releaseLength: 0.10,
// })

class ScheduledEnvelope {
	constructor(
		public readonly attackStart = 0,
		public readonly releaseStart = 0,
		public readonly hardCutoffTime = 0,
		public readonly attackLength = 0.005,
		// public readonly decay = 0.0,
		public readonly sustain = 1.0,
		public readonly releaseLength = 0.10,
	) {}

	public get attackEnd() {return this.attackStart + this.attackLength}

	public get releaseEnd() {
		return Math.min(Number.MAX_VALUE, this.releaseStart + this.releaseLength)
	}
}

/** All times in seconds */
// type ScheduledEnvelope = ReturnType<typeof makeScheduledEnvelope>
