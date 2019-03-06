import {Record} from 'immutable'
import uuid = require('uuid')
import {IDisposable} from '../../common/common-types'
import {logger} from '../../common/logger'
import {emptyMidiNotes, IMidiNote, IMidiNotes} from '../../common/MidiNote'
import {AudioNodeWrapper, IAudioNodeWrapperOptions} from './index'
import {registerInstrumentWithSchedulerVisual} from './SchedulerVisual'
import {Voice} from './Voice'
import {Voices} from './Voices'

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

	public readonly setAttack = (attackTimeInSeconds: number) => {
		if (this._attackTimeInSeconds === attackTimeInSeconds) return
		this._attackTimeInSeconds = attackTimeInSeconds
		this._getVoices().changeAttackForScheduledVoices(this._attackTimeInSeconds)
	}

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

const makeEnvelope = Record({
	attackStart: 0,
	releaseStart: 0,
	hardCutoffTime: 0,
	attack: 0.005,
	decay: 0.0,
	sustain: 1.0,
	release: 0.10,
})

// class Envelope {
// 	public readonly attackStart = 0
// 	public readonly releaseStart = 0
// 	public readonly hardCutoffTime = 0
// 	public readonly attack = 0.005
// 	public readonly decay = 0.0
// 	public readonly sustain = 1.0
// 	public readonly release = 0.10

// 	constructor(
// 	) {}
// }

type Envelope = ReturnType<typeof makeEnvelope>
