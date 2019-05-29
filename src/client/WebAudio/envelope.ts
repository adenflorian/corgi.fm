import {logger} from '../../common/logger'

export function applyEnvelope(
	previousScheduledEnvelope: ScheduledEnvelope | undefined,
	envelope: ScheduledEnvelope,
	gain: GainNode,
	sourceNode: AudioScheduledSourceNode,
	audioContext: AudioContext,
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

	sourceNode.stop(envelope.releaseEnd)
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

	// logger.log('EnvelopeStage: ', stage)

	if (stage === EnvelopeStage.beforeAttack) {
		// gain.gain.cancelScheduledValues(audioContext.currentTime)

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
		// logger.log('stage === EnvelopeStage.attack')
		_cancelAndHoldOrJustCancelAtTime(gain, audioContext.currentTime + 0.001)
		// logger.log('audioContext.currentTime: ', audioContext.currentTime)
		// logger.log('attackEnd: ', attackEnd)

		// Attack
		gain.gain.linearRampToValueAtTime(sustain, attackEnd)

		// // Sustain until release start
		// gain.gain.linearRampToValueAtTime(sustain, releaseStart)

		// // Release
		// gain.gain.exponentialRampToValueAtTime(0.00001, releaseEnd)

		return
	}

	return

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
	beforeAttack = 'beforeAttack',
	attack = 'attack',
	sustain = 'sustain',
	release = 'release',
	afterRelease = 'afterRelease',
}

interface CreateScheduledEnvelopeArgs {
	attackStart: number
	attackLength: number
	decayLength: number
	sustain: number
	releaseStart: number
	releaseLength: number
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

	const actualAttackEnd = Math.min(desiredAttackEnd, releaseStart)

	const actualSustain = _calculateSustain(actualAttackEnd, attackStart, sustain, releaseStart)

	// TODO Handle cutoff attack and cutoff release

	return new ScheduledEnvelope({
		attackStart,
		attackEnd: actualAttackEnd,
		decayLength,
		sustain: actualSustain,
		releaseStart,
		releaseEnd: releaseStart + releaseLength,
		hardCutoffTime,
	})
}

function _calculateSustain(actualAttackEnd: number, attackStart: number, sustain: number, releaseStart: number) {
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
	public readonly decayLength: number
	public readonly sustain: number
	public readonly releaseStart: number
	public readonly releaseEnd: number
	public readonly hardCutoffTime: number

	constructor(
		env: {
			attackStart: number,
			attackEnd: number,
			decayLength: number,
			sustain: number,
			releaseStart: number,
			releaseEnd: number,
			hardCutoffTime: number,
		},
	) {
		this.attackStart = env.attackStart
		this.attackEnd = env.attackEnd
		this.decayLength = env.decayLength
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
		return this.releaseEnd - this.releaseStart
	}
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
