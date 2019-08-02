import {Set} from 'immutable'
import {IMidiNote} from '@corgifm/common/MidiNote'
import {BuiltInBQFilterType} from '@corgifm/common/OscillatorTypes'
import {AudioNodeWrapper, IAudioNodeWrapperOptions, registerInstrumentWithSchedulerVisual, Voice, Voices} from '.'

export abstract class Instrument<T extends Voices<V>, V extends Voice> extends AudioNodeWrapper implements IDisposable {

	protected readonly _panNode: StereoPannerNode
	protected readonly _audioContext: AudioContext
	protected readonly _filter: BiquadFilterNode
	protected _attackTimeInSeconds: number = 0.01
	protected _decayTimeInSeconds: number = 0.25
	protected _sustain: number = 0.8
	protected _releaseTimeInSeconds: number = 3
	protected _filterAttackTimeInSeconds: number = 0.01
	protected _filterDecayTimeInSeconds: number = 0.25
	protected _filterSustain: number = 0.8
	protected _filterReleaseTimeInSeconds: number = 3
	protected _lowPassFilterCutoffFrequency: number = 20000
	protected _detune: number = 0
	private readonly _gain: GainNode
	protected readonly _lfoGainTarget: GainNode

	public constructor(options: IInstrumentOptions) {
		super(options)

		this._audioContext = options.audioContext

		this._panNode = this._audioContext.createStereoPanner()

		this._filter = this._audioContext.createBiquadFilter()
		this._filter.type = 'lowpass'
		this._filter.frequency.value = 10000

		this._lfoGainTarget = this._audioContext.createGain()
		this._lfoGainTarget.gain.value = 1

		this._gain = this._audioContext.createGain()
		// Just below 1 to help mitigate an infinite feedback loop
		this._gain.gain.value = 1

		this._panNode.connect(this._filter)
		this._filter.connect(this._lfoGainTarget)
		this._lfoGainTarget.connect(this._gain)

		registerInstrumentWithSchedulerVisual(this.id, () => this._getVoices().getScheduledVoices(), this._audioContext)
	}

	public scheduleNote(note: IMidiNote, delaySeconds: number, invincible: boolean, sourceIds: Set<Id>) {
		this._getVoices()
			.scheduleNote(
				note, delaySeconds,
				this._attackTimeInSeconds, this._decayTimeInSeconds, this._sustain,
				this._filterAttackTimeInSeconds, this._filterDecayTimeInSeconds, this._filterSustain,
				invincible, sourceIds,
			)
	}

	public scheduleRelease(note: number, delaySeconds: number) {
		this._getVoices().scheduleRelease(note, delaySeconds, this._releaseTimeInSeconds)
	}

	public releaseAllScheduled() {
		this._getVoices().releaseAllScheduled(this._releaseTimeInSeconds)
	}

	public releaseAllScheduledFromSourceId(sourceId: Id) {
		this._getVoices().releaseAllScheduledFromSourceId(this._releaseTimeInSeconds, sourceId)
	}

	public readonly getInputAudioNode = () => null
	public readonly getOutputAudioNode = () => this._gain

	public readonly setPan = (pan: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newPan = Math.fround(pan)
		if (newPan === this._panNode.pan.value) return
		this._panNode.pan.setValueAtTime(newPan, this._audioContext.currentTime)
	}

	public readonly setFilterCutoffFrequency = (frequency: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newFreq = Math.fround(frequency)
		if (newFreq === this._filter.frequency.value) return
		this._filter.frequency.linearRampToValueAtTime(newFreq, this._audioContext.currentTime + 0.004)
	}

	public readonly setFilterType = (filterType: BuiltInBQFilterType) => {
		if (filterType !== this._filter.type) {
			this._filter.type = filterType
		}
	}

	// TODO For filter envelope
	// public readonly setLowPassFilterCutoffFrequency = (frequency: number) => {
	// 	// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
	// 	const newFreq = Math.fround(frequency)
	// 	if (newFreq === this._lowPassFilterCutoffFrequency) return
	// 	this._lowPassFilterCutoffFrequency = newFreq
	// 	this._getVoices().setLowPassFilterCutoffFrequency(newFreq)
	// }

	public readonly setAttack = (attackTimeInSeconds: number) => {
		const clampedInput = Math.max(0.0001, attackTimeInSeconds)
		if (this._attackTimeInSeconds === clampedInput) return
		this._attackTimeInSeconds = clampedInput
		this._getVoices().changeAttackLengthForScheduledVoices(this._attackTimeInSeconds)
	}

	public readonly setDecay = (decayTimeInSeconds: number) => {
		const clampedInput = Math.max(0.0001, decayTimeInSeconds)
		if (this._decayTimeInSeconds === clampedInput) return
		this._decayTimeInSeconds = clampedInput
		// TODO?
		// this._getVoices().changeDecayLengthForScheduledVoices(this._decayTimeInSeconds)
	}

	public readonly setSustain = (sustain: number) => {
		if (this._sustain === sustain) return
		// Keep min above 0 as workaround for possible chrome bug causing audio context to die
		this._sustain = Math.max(0.01, sustain)
		// TODO?
		// this._getVoices().changeSustainLengthForScheduledVoices(this._sustain)
	}

	public readonly setRelease = (releaseTimeInSeconds: number) => {
		if (this._releaseTimeInSeconds === releaseTimeInSeconds) return
		this._releaseTimeInSeconds = releaseTimeInSeconds
		// TODO?
		// this._getVoices().changeSustainLengthForScheduledVoices(this._releaseTimeInSeconds)
	}

	public readonly setFilterAttack = (filterAttackTimeInSeconds: number) => {
		if (this._filterAttackTimeInSeconds === filterAttackTimeInSeconds) return
		this._filterAttackTimeInSeconds = filterAttackTimeInSeconds
		this._getVoices().changeAttackLengthForScheduledVoices(this._filterAttackTimeInSeconds)
	}

	public readonly setFilterDecay = (filterDecayTimeInSeconds: number) => {
		if (this._filterDecayTimeInSeconds === filterDecayTimeInSeconds) return
		this._filterDecayTimeInSeconds = filterDecayTimeInSeconds
		// TODO?
		// this._getVoices().changeDecayLengthForScheduledVoices(this._filterDecayTimeInSeconds)
	}

	public readonly setFilterSustain = (filterSustain: number) => {
		if (this._filterSustain === filterSustain) return
		this._filterSustain = filterSustain
		// TODO?
		// this._getVoices().changeSustainLengthForScheduledVoices(this._filterSustain)
	}

	public readonly setFilterRelease = (filterReleaseTimeInSeconds: number) => {
		if (this._filterReleaseTimeInSeconds === filterReleaseTimeInSeconds) return
		this._filterReleaseTimeInSeconds = filterReleaseTimeInSeconds
		// TODO?
		// this._getVoices().changeSustainLengthForScheduledVoices(this._filterReleaseTimeInSeconds)
	}

	public setDetune = (detune: number) => {
		if (detune === this._detune) return
		this._detune = detune
		this._getVoices().setDetune(detune)
	}

	public setGain(gain: number) {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newGain = Math.fround(gain)
		if (newGain === this._gain.gain.value) return
		this._gain.gain.linearRampToValueAtTime(newGain, this._audioContext.currentTime + 0.004)
	}

	public dispose = () => {
		this._getVoices().dispose()
		this._dispose()
	}

	protected _dispose = () => {
		this._panNode.disconnect()
		this._gain.disconnect()
		this._filter.disconnect()
	}

	protected abstract _getVoices(): T
}

export interface IInstrumentOptions extends IAudioNodeWrapperOptions {
}
