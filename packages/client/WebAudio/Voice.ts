import {Set} from 'immutable'
import {BuiltInBQFilterType} from '@corgifm/common/OscillatorTypes'
import {applyEnvelope, calculateScheduledEnvelope, IScheduledEnvelope} from './envelope'
import {OnEndedCallback} from '.'

export type TunableAudioScheduledSourceNode = AudioScheduledSourceNode & Pick<OscillatorNode, 'detune'>

export abstract class Voice {
	protected static _nextId = 0
	public readonly id: number
	public playingNote: number = -1
	public playStartTime: number = 0
	public sourceIds = Set<Id>()
	protected readonly _onEnded: OnEndedCallback
	protected _audioContext: AudioContext
	protected _destination: AudioNode
	protected _releaseId: Id = ''
	protected _filter: BiquadFilterNode
	protected _gain: GainNode
	protected _masterGain: GainNode
	protected _pan: StereoPannerNode
	protected _isReleaseScheduled = false
	protected _scheduledAttackStartTimeSeconds = 0
	protected _scheduledAttackEndTimeSeconds = 0
	protected _scheduledDecayEndTimeSeconds = 0
	protected _scheduledSustainAtDecayEnd = 1
	protected _scheduledSustainAtReleaseStart = 1
	protected _scheduledSustainAtReleaseEnd = 0
	protected _scheduledReleaseStartTimeSeconds = Number.MAX_VALUE
	protected _scheduledReleaseEndTimeSeconds = Number.MAX_VALUE
	protected _sustainLevel = 1
	protected _scheduledEnvelope: IScheduledEnvelope | undefined
	protected _detune: number = 0
	protected _ended = false

	public constructor(
		audioContext: AudioContext,
		destination: AudioNode,
		onEnded: OnEndedCallback,
		detune: number,
		filterCutoff: number,
		filterType: BuiltInBQFilterType,
		protected readonly _invincible: boolean,
		masterGainAmount: number = 0.5,
		pan: number = 0,
	) {
		this.id = Voice._nextId++
		this._audioContext = audioContext
		this._destination = destination
		this._onEnded = onEnded
		this._detune = detune

		this._filter = this._audioContext.createBiquadFilter()
		this._filter.type = filterType
		this._filter.frequency.value = filterCutoff

		this._gain = this._audioContext.createGain()
		this._masterGain = this._audioContext.createGain()
		this._pan = this._audioContext.createStereoPanner()

		this._masterGain.gain.value = masterGainAmount
		this._pan.pan.value = pan
	}

	public get scheduledAttackStartTime() {return this._scheduledAttackStartTimeSeconds}
	public get scheduledAttackEndTime() {return this._scheduledAttackEndTimeSeconds}
	public get scheduledDecayEndTime() {return this._scheduledDecayEndTimeSeconds}
	public get scheduledSustainAtDecayEnd() {return this._scheduledSustainAtDecayEnd}
	public get scheduledSustainAtReleaseStart() {return this._scheduledSustainAtReleaseStart}
	public get scheduledSustainAtReleaseEnd() {return this._scheduledSustainAtReleaseEnd}
	public get scheduledReleaseStartTimeSeconds() {return this._scheduledReleaseStartTimeSeconds}
	public get scheduledReleaseEndTimeSeconds() {return this._scheduledReleaseEndTimeSeconds}
	public get scheduledEnvelope() {return this._scheduledEnvelope}
	public get invincible() {return this._invincible}

	public getIsReleaseScheduled = () => this._isReleaseScheduled

	public getReleaseId = () => this._releaseId

	public abstract getAudioScheduledSourceNode(): TunableAudioScheduledSourceNode | undefined

	public setDetune(detune: number) {
		if (detune === this._detune) return

		this._detune = detune

		this.getAudioScheduledSourceNode()!.detune.value = detune
	}

	// eslint-disable-next-line class-methods-use-this
	public setLowPassFilterCutoffFrequency(frequency: number) {
		// if (frequency === this._filter.frequency.value) return

		// this._filter.frequency.value = frequency
	}

	public scheduleNote(
		note: number,
		attackTimeInSeconds: number,
		decayTimeInSeconds: number,
		sustain: number,
		attackStart: number,
		sourceIds: Set<Id>,
	): void {
		this.sourceIds = this.sourceIds.concat(sourceIds)

		this._scheduleNoteSpecific(note)

		this.getAudioScheduledSourceNode()!.detune.value = this._detune

		// this.getAudioScheduledSourceNode()!.connect(this._filter)
		this.getAudioScheduledSourceNode()!
			.connect(this._filter)
			.connect(this._masterGain)
			.connect(this._gain)
			.connect(this._pan)
			.connect(this._destination)

		this.playingNote = note

		this._scheduledEnvelope = calculateScheduledEnvelope({
			attackStart,
			attackLength: attackTimeInSeconds,
			decayLength: decayTimeInSeconds,
			sustain,
			hardCutoffTime: Number.MAX_VALUE,
		})

		this._scheduledAttackStartTimeSeconds = this._scheduledEnvelope.attackStart
		this._scheduledAttackEndTimeSeconds = this._scheduledEnvelope.attackEnd
		this._scheduledDecayEndTimeSeconds = this._scheduledEnvelope.decayEnd
		this._scheduledSustainAtDecayEnd = this._scheduledEnvelope.sustain

		this.getAudioScheduledSourceNode()!.start(this._scheduledEnvelope.attackStart)

		applyEnvelope(
			undefined,
			this._scheduledEnvelope,
			this._gain.gain,
			this.getAudioScheduledSourceNode()!,
			this._audioContext,
		)

		// TODO Filter envelope
		// applyEnvelope(
		// 	undefined,
		// 	this._scheduledEnvelope,
		// 	this._filter.frequency,
		// 	this.getAudioScheduledSourceNode()!,
		// 	this._audioContext,
		// 	2000,
		// 	100,
		// )

		this.getAudioScheduledSourceNode()!.onended = () => this.dispose()
	}

	protected abstract _scheduleNoteSpecific(note: number): void

	public scheduleRelease(
		newReleaseStartTime: number,
		releaseSeconds: number,
		releaseIfNotCurrentlyReleasing = false,
	) {
		if (this._ended) return

		const audioNode = this.getAudioScheduledSourceNode()!

		if (releaseIfNotCurrentlyReleasing) {
			if (this._audioContext.currentTime < this._scheduledAttackStartTimeSeconds) {
				this._gain.gain.cancelScheduledValues(this._audioContext.currentTime)
				audioNode.stop()
				audioNode.disconnect()
				this._filter.disconnect()
				delete this._filter
				this._gain.disconnect()
				delete this._gain
				this._masterGain.disconnect()
				delete this._masterGain
				this._pan.disconnect()
				delete this._pan
				this._ended = true
				this._onEnded(this.id)
				return
			}
			if (this._audioContext.currentTime > this._scheduledReleaseStartTimeSeconds) {
				return
			}
			if (newReleaseStartTime > this.scheduledReleaseEndTimeSeconds) {
				return
			}
		}

		const newReleaseEndTime = newReleaseStartTime + releaseSeconds

		if (newReleaseEndTime > this._scheduledReleaseEndTimeSeconds) {
			return
		}

		if (this._isReleaseScheduled) {
			// trying to re-release a voice
			// new release start time must be between original attack start and release end
			// is new release start before or after original release start?
			// if after, then assume hard cutoff
			// if before, need to redo all release stuff

			if (newReleaseStartTime >= this._scheduledReleaseStartTimeSeconds) {
				const originalReleaseEndTime = this._scheduledReleaseEndTimeSeconds
				const originalReleaseLength = originalReleaseEndTime - this._scheduledReleaseStartTimeSeconds

				this._scheduledReleaseEndTimeSeconds = newReleaseEndTime

				const newReleaseLength = this._scheduledReleaseEndTimeSeconds - this._scheduledReleaseStartTimeSeconds
				const ratio = newReleaseLength / originalReleaseLength
				// Not accurate for a curved release, will be too high
				this._scheduledSustainAtReleaseEnd = this._scheduledSustainAtReleaseStart - (ratio * this._scheduledSustainAtReleaseStart)

				const shortReleaseLength = 0.001
				const cancelTime = this._scheduledReleaseEndTimeSeconds - shortReleaseLength

				// TODO This won't work until that chrome bug fix goes live in chrome 72
				this._cancelAndHoldOrJustCancelAtTime(cancelTime)
				this._gain.gain.linearRampToValueAtTime(0, this._scheduledReleaseEndTimeSeconds)

				audioNode.stop(Math.max(this._audioContext.currentTime + 0.001, this._scheduledReleaseEndTimeSeconds))
				return
			} else {
				// Let it do normal release stuff
			}
		}

		this._scheduledReleaseStartTimeSeconds = newReleaseStartTime
		this._scheduledReleaseEndTimeSeconds = newReleaseEndTime

		let cancelled = false

		if (this._isReleaseScheduled) {
			this._cancelAndHoldOrJustCancelAtTime(
				releaseIfNotCurrentlyReleasing
					? undefined
					: Math.max(this._audioContext.currentTime + 0.0001, this._scheduledReleaseStartTimeSeconds),
			)
			cancelled = true
		}

		const releaseStartIsDuringAttack = () => this._scheduledReleaseStartTimeSeconds <= this._scheduledAttackEndTimeSeconds
		const releaseStartIsDuringDecay = () => !releaseStartIsDuringAttack() && this._scheduledReleaseStartTimeSeconds <= this._scheduledDecayEndTimeSeconds

		if (releaseStartIsDuringAttack()) {
			// for linear attack only, need different math for other attack curves
			const originalAttackLength = this._scheduledAttackEndTimeSeconds - this._scheduledAttackStartTimeSeconds
			const newAttackLength = this._scheduledReleaseStartTimeSeconds - this._scheduledAttackStartTimeSeconds
			const ratio = newAttackLength / originalAttackLength
			const targetSustainAtReleaseStart = ratio * this._scheduledSustainAtDecayEnd

			this._scheduledAttackEndTimeSeconds = this._scheduledReleaseStartTimeSeconds
			this._scheduledSustainAtDecayEnd = targetSustainAtReleaseStart
			this._scheduledSustainAtReleaseStart = targetSustainAtReleaseStart

			if (!cancelled) {
				this._cancelAndHoldOrJustCancelAtTime(
					Math.max(this._audioContext.currentTime + 0.0001, this._scheduledReleaseStartTimeSeconds),
				)
				cancelled = true
			}
		} else if (releaseStartIsDuringDecay()) {
			// for linear decay only, need different math for other decay curves
			// Not sure if this is actually doing anything...
			const originalDecayLength = this._scheduledDecayEndTimeSeconds - this._scheduledAttackEndTimeSeconds
			const newDecayLength = this._scheduledReleaseStartTimeSeconds - this._scheduledAttackEndTimeSeconds
			const ratio = newDecayLength / originalDecayLength
			const targetSustainAtReleaseStart = ratio * this._scheduledSustainAtDecayEnd

			this._scheduledDecayEndTimeSeconds = this._scheduledReleaseStartTimeSeconds
			this._scheduledSustainAtDecayEnd = targetSustainAtReleaseStart
			this._scheduledSustainAtReleaseStart = targetSustainAtReleaseStart

			if (!cancelled) {
				this._cancelAndHoldOrJustCancelAtTime(
					Math.max(this._audioContext.currentTime + 0.0001, this._scheduledReleaseStartTimeSeconds),
				)
				cancelled = true
			}
		} else {
			// if release is during sustain
			this._gain.gain.linearRampToValueAtTime(this._scheduledSustainAtDecayEnd, this._scheduledReleaseStartTimeSeconds)
		}

		const rampEndTime = Math.max(this._audioContext.currentTime + 0.001, this._scheduledReleaseEndTimeSeconds)
		this._gain.gain.exponentialRampToValueAtTime(0.00001, rampEndTime)

		audioNode.stop(this._scheduledReleaseEndTimeSeconds)
		this._isReleaseScheduled = true
	}

	// eslint-disable-next-line class-methods-use-this
	public changeScheduledAttack(newAttackSeconds: number) {
		// Can't do this until this chrome bug is fixed:
		// https://bugs.chromium.org/p/chromium/issues/detail?id=904244
		// return

		// If attack already finished
		// if (this.scheduledEnvelope!.attackEnd < this._audioContext.currentTime) return

		// const newEnv = calculateScheduledEnvelope({
		// 	attackStart: this.scheduledEnvelope!.attackStart,
		// 	attackLength: newAttackSeconds,
		// 	decayLength: this.scheduledEnvelope!.decayEnd,
		// 	sustain: this.scheduledEnvelope!.sustain,
		// 	releaseStart: this.scheduledEnvelope!.releaseStart,
		// 	releaseLength: this.scheduledEnvelope!.releaseLength,
		// 	hardCutoffTime: this.scheduledEnvelope!.hardCutoffTime,
		// })

		// applyEnvelope(
		// 	this.scheduledEnvelope,
		// 	newEnv,
		// 	this._gain.gain,
		// 	this.getAudioScheduledSourceNode()!,
		// 	this._audioContext,
		// )

		// this._scheduledEnvelope = newEnv
	}

	public abstract dispose(): void

	protected _dispose() {
		if (this._filter) this._filter.disconnect()
		if (this._filter) delete this._filter
		if (this._gain) this._gain.disconnect()
		if (this._gain) delete this._gain
		if (this._masterGain) this._masterGain.disconnect()
		if (this._masterGain) delete this._masterGain
		if (this._pan) this._pan.disconnect()
		if (this._pan) delete this._pan
		this._onEnded(this.id)
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
