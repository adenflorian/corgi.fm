import {logger} from '@corgifm/common/logger'

export function applyEnvelope(
	previousScheduledEnvelope: ScheduledEnvelope | undefined,
	envelope: ScheduledEnvelope,
	audioParam: AudioParam,
	sourceNode: AudioScheduledSourceNode,
	audioContext: AudioContext,
	peak: number = 1,
	sustainMultiplier?: number,
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
		audioParam,
		previousScheduledEnvelope,
		envelope,
		peak,
		sustainMultiplier,
	)

	if (envelope.releaseEnd !== undefined) sourceNode.stop(envelope.releaseEnd)
}

function _applyEnvelopeToGain(
	audioContext: AudioContext,
	audioParam: AudioParam,
	previousScheduledEnvelope: ScheduledEnvelope | undefined,
	{attackStart, attackEnd, decayEnd, sustain, releaseStart, releaseEnd}: ScheduledEnvelope,
	peak: number,
	sustainMultiplier?: number,
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

	// logger.log('EnvelopeStage: ', stage)

	const actualSustain = sustainMultiplier || sustain

	if (stage === EnvelopeStage.beforeAttack) {
		// audioParam.cancelScheduledValues(audioContext.currentTime)

		// Before attack
		audioParam.linearRampToValueAtTime(0, attackStart)

		// Attack
		audioParam.linearRampToValueAtTime(peak, attackEnd)

		// Decay
		audioParam.linearRampToValueAtTime(actualSustain, decayEnd)

		if (releaseStart === undefined || releaseEnd === undefined) return

		// Sustain until release start
		audioParam.linearRampToValueAtTime(actualSustain, releaseStart)

		// Release
		audioParam.exponentialRampToValueAtTime(0.00001, releaseEnd)

		return
	}

	if (stage === EnvelopeStage.attack) {
		// logger.log('stage === EnvelopeStage.attack')
		_cancelAndHoldOrJustCancelAtTime(audioParam, audioContext.currentTime + 0.001)
		// logger.log('audioContext.currentTime: ', audioContext.currentTime)
		// logger.log('attackEnd: ', attackEnd)

		// Attack
		audioParam.linearRampToValueAtTime(actualSustain, attackEnd)

		// TODO
		// Decay?
		// It clicks when rescheduled during decay i think
		audioParam.linearRampToValueAtTime(actualSustain, decayEnd)

		// // Sustain until release start
		// audioParam.linearRampToValueAtTime(actualSustain, releaseStart)

		// // Release
		// audioParam.exponentialRampToValueAtTime(0.00001, releaseEnd)

		return
	}

	// TODO
	if (stage === EnvelopeStage.decay) {
		_cancelAndHoldOrJustCancelAtTime(audioParam, audioContext.currentTime + 0.001)

		// TODO
		// Decay?
		audioParam.linearRampToValueAtTime(actualSustain, decayEnd)

		// // Sustain until release start
		// audioParam.linearRampToValueAtTime(actualSustain, releaseStart)

		// // Release
		// audioParam.exponentialRampToValueAtTime(0.00001, releaseEnd)

		return
	}

	return

	// if (stage === EnvelopeStage.sustain) {
	// 	_cancelAndHoldOrJustCancelAtTime(audioParam, audioContext.currentTime)

	// 	// Sustain until release start
	// 	audioParam.linearRampToValueAtTime(actualSustain, releaseStart)

	// 	// Release
	// 	audioParam.exponentialRampToValueAtTime(0.00001, releaseEnd)

	// 	return
	// }

	// if (stage === EnvelopeStage.release) {
	// 	_cancelAndHoldOrJustCancelAtTime(audioParam, audioContext.currentTime)

	// 	// Release
	// 	audioParam.exponentialRampToValueAtTime(0.00001, releaseEnd)

	// 	return
	// }

	// if (stage === EnvelopeStage.afterRelease) {
	// 	return
	// }
}

function _determineEnvelopeStage(
	audioContext: AudioContext,
	{attackStart, attackEnd, decayEnd, releaseStart, releaseEnd}: ScheduledEnvelope,
) {
	const currentTime = audioContext.currentTime

	if (currentTime < attackStart) return EnvelopeStage.beforeAttack

	if (currentTime < attackEnd) return EnvelopeStage.attack

	if (currentTime < decayEnd) return EnvelopeStage.decay

	if (releaseStart === undefined || releaseEnd === undefined) return EnvelopeStage.sustain

	if (currentTime < releaseStart) return EnvelopeStage.sustain

	if (currentTime < releaseEnd) return EnvelopeStage.release

	return EnvelopeStage.afterRelease
}

enum EnvelopeStage {
	beforeAttack = 'beforeAttack',
	attack = 'attack',
	decay = 'decay',
	sustain = 'sustain',
	release = 'release',
	afterRelease = 'afterRelease',
}

interface CreateScheduledEnvelopeArgs {
	attackStart: number
	attackLength: number
	decayLength: number
	sustain: number
	releaseStart?: number
	releaseLength?: number
	hardCutoffTime: number
}

export function calculateScheduledEnvelope(
	{
		attackStart,
		attackLength,
		decayLength,
		sustain,
		releaseStart,
		releaseLength,
		hardCutoffTime,
	}: CreateScheduledEnvelopeArgs,
) {
	const desiredAttackEnd = attackStart + attackLength

	const actualAttackEnd = Math.min(desiredAttackEnd, releaseStart || Number.MAX_SAFE_INTEGER)

	const actualDecayEnd = actualAttackEnd + decayLength

	const actualSustain = _calculateSustain(actualAttackEnd, attackStart, sustain, releaseStart || Number.MAX_SAFE_INTEGER)

	// TODO Handle cutoff attack and cutoff release

	return new ScheduledEnvelope({
		attackStart,
		attackEnd: actualAttackEnd,
		decayEnd: actualDecayEnd,
		sustain: actualSustain,
		releaseStart,
		releaseEnd: releaseStart === undefined || releaseLength === undefined ? undefined : releaseStart + releaseLength,
		hardCutoffTime,
	})
}

// TODO Make it account for decay (if needed?)
function _calculateSustain(actualAttackEnd: number, attackStart: number, sustain: number, releaseStart: number) {
	if (sustain === 0) return 0
	const originalAttackLength = actualAttackEnd - attackStart
	const actualAttackLength = releaseStart - attackStart
	const ratio = actualAttackLength / originalAttackLength
	const adjustedSustain = ratio * sustain

	return Math.min(sustain, adjustedSustain)
}

export type IScheduledEnvelope = ScheduledEnvelope

class ScheduledEnvelope {
	public readonly attackStart: number
	public readonly attackEnd: number
	public readonly decayEnd: number
	public readonly sustain: number
	public readonly releaseStart?: number
	public readonly releaseEnd?: number
	public readonly hardCutoffTime: number

	constructor(
		env: {
			attackStart: number,
			attackEnd: number,
			decayEnd: number,
			sustain: number,
			releaseStart?: number,
			releaseEnd?: number,
			hardCutoffTime: number,
		},
	) {
		this.attackStart = env.attackStart
		this.attackEnd = env.attackEnd
		this.decayEnd = env.decayEnd
		this.sustain = env.sustain
		this.releaseStart = env.releaseStart
		this.releaseEnd = env.releaseEnd
		this.hardCutoffTime = env.hardCutoffTime
	}

	// public get attackEnd() {return this.attackStart + this.attackLength}

	// public get releaseEnd() {
	// 	return Math.min(Number.MAX_VALUE, this.releaseStart + this.releaseLength)
	// }

	public get releaseLength() {
		if (this.releaseStart === undefined || this.releaseEnd === undefined) return Number.MAX_VALUE
		return this.releaseEnd - this.releaseStart
	}
}

/** If cancelAndHold is called with a past time it doesn't work */
function _cancelAndHoldOrJustCancelAtTime(audioParam: AudioParam, time: number) {
	// cancelAndHoldAtTime is not implemented in firefox
	if (audioParam.cancelAndHoldAtTime) {
		audioParam.cancelAndHoldAtTime(time)
	} else {
		audioParam.cancelScheduledValues(time)
	}
}
