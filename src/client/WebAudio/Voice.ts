import uuid = require('uuid')
import {OnEndedCallback} from './index'

enum VoiceStatus {
	playing,
	releasing,
	off,
}

export type TunableAudioScheduledSourceNode = AudioScheduledSourceNode & Pick<OscillatorNode, 'detune'>

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
	protected _scheduledEnvelope: ScheduledEnvelope | undefined
	protected _detune: number = 0

	constructor(
		audioContext: AudioContext,
		destination: AudioNode,
		onEnded: OnEndedCallback,
		detune: number,
	) {
		this.id = Voice._nextId++
		this._audioContext = audioContext
		this._destination = destination
		this._onEnded = onEnded
		this._detune = detune

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

	public abstract getAudioScheduledSourceNode(): TunableAudioScheduledSourceNode | undefined

	public abstract playNote(note: number, attackTimeInSeconds: number): void

	public setDetune(detune: number) {
		if (detune === this._detune) return

		this._detune = detune

		this.getAudioScheduledSourceNode()!.detune.value = detune
	}

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

		this.getAudioScheduledSourceNode()!.detune.value = this._detune

		this.getAudioScheduledSourceNode()!.connect(this._gain)
			.connect(this._destination)

		this.playingNote = note

		this._scheduledEnvelope = calculateScheduledEnvelope({
			attackStart: this._audioContext.currentTime + delaySeconds,
			attackLength: attackTimeInSeconds,
			sustain: this._sustainLevel,
			releaseStart: Number.MAX_VALUE,
			releaseLength: 0,
			hardCutoffTime: Number.MAX_VALUE,
		})

		this._scheduledAttackStartTimeSeconds = this._scheduledEnvelope.attackStart
		this._scheduledAttackEndTimeSeconds = this._scheduledEnvelope.attackEnd

		_applyEnvelope(
			undefined,
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
	previousScheduledEnvelope: ScheduledEnvelope | undefined,
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

	// Before doing this, make sure we took everything else into account that we need to
	// - [√] releaseStart
	// - [ ] hard cutoff
	//   - if the next note starts before this on finishes its release
	//   - could affect:
	//     - [ ] actualAttackEnd
	//     - [ ] actualSustain
	//     - [ ] ?

	_applyEnvelopeToGain(
		audioContext,
		gain,
		previousScheduledEnvelope,
		envelope,
	)

	if (startSource) {
		sourceNode.start(envelope.attackStart)
	}

	sourceNode.stop(envelope.releaseEnd)

	sourceNode.onended = onEnded
}

function _applyEnvelopeToGain(
	audioContext: AudioContext,
	gain: GainNode,
	previousScheduledEnvelope: ScheduledEnvelope | undefined,
	{attackStart, attackEnd, sustain, releaseStart, releaseEnd}: ScheduledEnvelope,
) {
	/*
	id need to calculate the current sustain at any time
	- can do
	- see desmos graph
	- https://www.desmos.com/calculator/t99q8totkj
	*/

	// TODO Need to use previous envelopes values
	const stage = previousScheduledEnvelope === undefined
		? EnvelopeStage.beforeAttack
		: _determineEnvelopeStage(
			audioContext,
			previousScheduledEnvelope,
		)

	// _cancelAndHoldOrJustCancelAtTime(gain, audioContext.currentTime)

	if (stage === EnvelopeStage.beforeAttack) {
		gain.gain.cancelScheduledValues(audioContext.currentTime)

		// Before attack
		gain.gain.value = 0
		gain.gain.linearRampToValueAtTime(0, attackStart)

		// Attack
		gain.gain.linearRampToValueAtTime(sustain, attackEnd)

		// Sustain until release start
		gain.gain.linearRampToValueAtTime(sustain, releaseStart)

		// Release
		gain.gain.exponentialRampToValueAtTime(0.00001, releaseEnd)

		return
	}

	if (stage === EnvelopeStage.attack) {
		_cancelAndHoldOrJustCancelAtTime(gain, audioContext.currentTime)

		// Attack
		gain.gain.linearRampToValueAtTime(sustain, attackEnd)

		// Sustain until release start
		gain.gain.linearRampToValueAtTime(sustain, releaseStart)

		// Release
		gain.gain.exponentialRampToValueAtTime(0.00001, releaseEnd)

		return
	}

	if (stage === EnvelopeStage.sustain) {
		_cancelAndHoldOrJustCancelAtTime(gain, audioContext.currentTime)

		// Sustain until release start
		gain.gain.linearRampToValueAtTime(sustain, releaseStart)

		// Release
		gain.gain.exponentialRampToValueAtTime(0.00001, releaseEnd)

		return
	}

	if (stage === EnvelopeStage.release) {
		_cancelAndHoldOrJustCancelAtTime(gain, audioContext.currentTime)

		// Release
		gain.gain.exponentialRampToValueAtTime(0.00001, releaseEnd)

		return
	}

	if (stage === EnvelopeStage.afterRelease) {
		return
	}
}

function _determineEnvelopeStage(
	audioContext: AudioContext,
	{attackStart, attackEnd, releaseStart, releaseEnd}: ScheduledEnvelope,
) {
	const currentTime = audioContext.currentTime

	if (currentTime < attackStart) return EnvelopeStage.beforeAttack

	if (currentTime < attackEnd) return EnvelopeStage.attack

	if (currentTime < releaseStart) return EnvelopeStage.sustain

	if (currentTime < releaseEnd) return EnvelopeStage.release

	return EnvelopeStage.afterRelease
}

enum EnvelopeStage {
	beforeAttack,
	attack,
	sustain,
	release,
	afterRelease,
}

interface CreateScheduledEnvelopeArgs {
	attackStart: number
	attackLength: number
	// decay: number
	sustain: number
	releaseStart: number
	releaseLength: number
	hardCutoffTime: number
}

function calculateScheduledEnvelope(
	{
		attackStart,
		attackLength,
		sustain,
		releaseStart,
		releaseLength,
		hardCutoffTime,
	}: CreateScheduledEnvelopeArgs,
) {
	const desiredAttackEnd = attackStart + attackLength

	const actualAttackEnd = Math.min(desiredAttackEnd, releaseStart)

	const actualSustain = calculateSustain(actualAttackEnd, attackStart, sustain, releaseStart)

	// TODO Handle cutoff attack and cutoff release

	return new ScheduledEnvelope({
		attackStart,
		attackEnd: actualAttackEnd,
		sustain: actualSustain,
		releaseStart,
		releaseEnd: releaseStart + releaseLength,
		hardCutoffTime,
	})
}

function calculateSustain(actualAttackEnd: number, attackStart: number, sustain: number, releaseStart: number) {
	const originalAttackLength = actualAttackEnd - attackStart
	const actualAttackLength = releaseStart - attackStart
	const ratio = actualAttackLength / originalAttackLength
	const adjustedSustain = ratio * sustain

	return Math.min(sustain, adjustedSustain)
}

class ScheduledEnvelope {
	public readonly attackStart: number
	public readonly attackEnd: number
	// public readonly decay: number
	public readonly sustain: number
	public readonly releaseStart: number
	public readonly releaseEnd: number
	public readonly hardCutoffTime: number

	constructor(
		env: ScheduledEnvelope,
	) {
		this.attackStart = env.attackStart
		this.attackEnd = env.attackEnd
		//  this.decay  = env.decay
		this.sustain = env.sustain
		this.releaseStart = env.releaseStart
		this.releaseEnd = env.releaseEnd
		this.hardCutoffTime = env.hardCutoffTime
	}

	// public get attackEnd() {return this.attackStart + this.attackLength}

	// public get releaseEnd() {
	// 	return Math.min(Number.MAX_VALUE, this.releaseStart + this.releaseLength)
	// }
}

/** If cancelAndHold is called with a past time it doesn't work */
function _cancelAndHoldOrJustCancelAtTime(gain: GainNode, time: number) {
	// cancelAndHoldAtTime is not implemented in firefox
	if (gain.gain.cancelAndHoldAtTime) {
		gain.gain.cancelAndHoldAtTime(time)
	} else {
		gain.gain.cancelScheduledValues(time)
	}
}
