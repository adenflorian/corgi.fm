import {Envelope} from 'tone'
import uuid = require('uuid')
import {OnEndedCallback} from '.'

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

	constructor(audioContext: AudioContext, destination: AudioNode, onEnded: OnEndedCallback) {
		this.id = Voice._nextId++
		this._audioContext = audioContext
		this._destination = destination
		this._onEnded = onEnded

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

		this._scheduledAttackStartTimeSeconds = this._audioContext.currentTime + delaySeconds
		this._scheduledAttackEndTimeSeconds = this._scheduledAttackStartTimeSeconds + attackTimeInSeconds

		this._scheduleNoteSpecific(note)

		this._gain = this._audioContext.createGain()
		this._gain.gain.value = 0
		this._gain.gain.linearRampToValueAtTime(0, this._scheduledAttackStartTimeSeconds)
		this._gain.gain.linearRampToValueAtTime(this._sustainLevel, this._scheduledAttackEndTimeSeconds)

		// logger.log(this.id + ' synth scheduleNote delaySeconds: ' + delaySeconds + ' | note: ' + note + ' | attackTimeInSeconds: ' + attackTimeInSeconds)

		this.getAudioNodeToStop()!.connect(this._gain)
			.connect(this._destination)

		this.getAudioNodeToStop()!.start(this._scheduledAttackStartTimeSeconds)

		this.playingNote = note
	}

	protected abstract _scheduleNoteSpecific(note: number): void

	public abstract getAudioNodeToStop(): AudioScheduledSourceNode | undefined

	public scheduleRelease(
		delaySeconds: number,
		releaseSeconds: number,
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

				if (releaseIfNotCurrentlyReleasing) {
					return
				}

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

				if (!audioNode) throw new Error('AAAAAAAAAAAAAAA')
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

		if (!audioNode) throw new Error('BBBBBBBBBBBBB')
		audioNode.stop(this._scheduledReleaseEndTimeSeconds)
		audioNode.onended = () => {
			audioNode!.disconnect()
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
		if (this.getScheduledAttackEndTime() < this._audioContext.currentTime) return

	}

	public applyEnvelope(envelope: Envelope) {
		// need gain and source node
		// this._gain
		// this.getAudioNodeToStop()
		// got em

		// what will schedule note look like?
		// currently its handled by the voice impl
		// have public func on Voice and inner ones for the impls

		// this is more complicated than it has to be because im still supporting the old system in same classes
	}

	public abstract dispose(): void

	protected _dispose() {
		this._gain.disconnect()
		delete this._gain
	}

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
