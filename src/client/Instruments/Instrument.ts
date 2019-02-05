import uuid = require('uuid')
import {IDisposable} from '../../common/common-types'
import {emptyMidiNotes, IMidiNotes} from '../../common/MidiNote'
import {Arp} from '../arp'

export interface IAudioNodeWrapper extends IDisposable {
	getInputAudioNode: () => AudioNode
	getOutputAudioNode: () => AudioNode
	connect: (destination: IAudioNodeWrapper, targetId: string) => void
	disconnectAll: () => void
	getConnectedTargetId: () => string
}

export interface IInstrument extends IDisposable, IAudioNodeWrapper {
	setMidiNotes: (midiNotes: IMidiNotes) => void
	setPan: (pan: number) => void
	setLowPassFilterCutoffFrequency: (frequency: number) => void
	setAttack: (attackTimeInSeconds: number) => void
	setRelease: (releaseTimeInSeconds: number) => void
	getActivityLevel: () => number
}

export abstract class Instrument<T extends Voices<V>, V extends Voice> implements IInstrument {
	protected readonly _panNode: StereoPannerNode
	protected readonly _audioContext: AudioContext
	protected readonly _lowPassFilter: BiquadFilterNode
	private readonly _arp = new Arp()
	private readonly _gain: GainNode
	private _previousNotes = emptyMidiNotes
	private _attackTimeInSeconds: number = 0.01
	private _releaseTimeInSeconds: number = 3
	private _connectedTargetId: string = '-1'

	constructor(options: IInstrumentOptions, startingGainValue: number) {
		this._audioContext = options.audioContext

		this._panNode = this._audioContext.createStereoPanner()

		this._lowPassFilter = this._audioContext.createBiquadFilter()
		this._lowPassFilter.type = 'lowpass'
		this._lowPassFilter.frequency.value = 10000

		this._gain = this._audioContext.createGain()
		this._gain.gain.value = startingGainValue

		// this._arp.start(this._setMidiNotesFromArp)

		// this._lfo.connect(lfoGain)
		// 	.connect(this._gain.gain)

		this._panNode.connect(this._lowPassFilter)
		this._lowPassFilter.connect(this._gain)
		this._gain.connect(options.destination)

		if (module.hot) {
			module.hot.dispose(this.dispose)
		}
	}

	public readonly connect = (destination: IAudioNodeWrapper, targetId: string) => {
		this.disconnectAll()
		this._gain.connect(destination.getInputAudioNode())
		this._connectedTargetId = targetId
	}

	public readonly disconnectAll = () => {
		this._gain.disconnect()
		this._connectedTargetId = '-1'
	}

	public readonly getConnectedTargetId = () => this._connectedTargetId

	// TODO Not sure if this will be ok, might need a dummy node?
	public getInputAudioNode = () => this._gain

	public getOutputAudioNode = () => this._gain

	public setPan = (pan: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newPan = Math.fround(pan)
		if (newPan !== this._panNode.pan.value) {
			this._panNode.pan.setValueAtTime(newPan, this._audioContext.currentTime)
		}
	}

	public setLowPassFilterCutoffFrequency = (frequency: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newFreq = Math.fround(frequency)
		if (newFreq !== this._lowPassFilter.frequency.value) {
			this._lowPassFilter.frequency.setValueAtTime(newFreq, this._audioContext.currentTime)
		}
	}

	public setMidiNotes = (midiNotes: IMidiNotes) => {
		const arp = false

		if (arp) {
			this._arp.setNotes(midiNotes)
		} else {
			this._setMidiNotesFromArp(midiNotes)
		}
	}

	public setAttack = (attackTimeInSeconds: number) => this._attackTimeInSeconds = attackTimeInSeconds

	public setRelease = (releaseTimeInSeconds: number) => this._releaseTimeInSeconds = releaseTimeInSeconds

	public getActivityLevel = () => this._getVoices().getActivityLevel()

	public abstract dispose(): void

	protected _dispose = () => {
		this._panNode.disconnect()
		this._gain.disconnect()
		this._lowPassFilter.disconnect()
		this._arp.dispose()
	}

	protected abstract _getVoices(): T

	private readonly _setMidiNotesFromArp = (midiNotes: IMidiNotes) => {
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
}

export interface IInstrumentOptions {
	audioContext: AudioContext
	destination: AudioNode
	voiceCount: number
}

export enum VoiceStatus {
	playing,
	releasing,
	off,
}

export abstract class Voices<V extends Voice> {
	protected _inactiveVoices: V[] = []
	protected _activeVoices: V[] = []
	protected _releasingVoices: V[] = []

	public playNote(note: number, attackTimeInSeconds: number) {
		const voice = this._getVoice(note)

		voice.playNote(note, attackTimeInSeconds)
	}

	public releaseNote = (note: number, timeToReleaseInSeconds: number) => {
		const voice = this._activeVoices.find(x => x.playingNote === note)

		if (voice) {
			const releaseId = voice.release(timeToReleaseInSeconds)

			this._activeVoices = this._activeVoices.filter(x => x !== voice)
			this._releasingVoices.push(voice)

			setTimeout(() => {
				const releasingVoice = this._releasingVoices.find(x => x.getReleaseId() === releaseId)
				if (releasingVoice) {
					this._releasingVoices = this._releasingVoices.filter(x => x.getReleaseId() !== releaseId)
					this._inactiveVoices.push(releasingVoice)
				}
			}, timeToReleaseInSeconds * 1000)
		}
	}

	public getActivityLevel = () => {
		if (this._activeVoices.length > 0) return 1
		if (this._releasingVoices.length > 0) return 0.5
		return 0
	}

	public dispose() {
		this._inactiveVoices
			.concat(this._releasingVoices)
			.concat(this._activeVoices)
			.forEach(x => x.dispose())
	}

	protected _getVoice(note: number): V {
		// Look for active voice that is playing same note
		const sameNoteActiveVoice = this._activeVoices.find(x => x.playingNote === note)

		if (sameNoteActiveVoice) {
			this._activeVoices = this._activeVoices.filter(x => x !== sameNoteActiveVoice)
			this._activeVoices.push(sameNoteActiveVoice)
			return sameNoteActiveVoice
		}

		// Look for releasing voice that is playing same note
		const sameNoteReleasingVoice = this._releasingVoices.find(x => x.playingNote === note)

		if (sameNoteReleasingVoice) {
			this._releasingVoices = this._releasingVoices.filter(x => x !== sameNoteReleasingVoice)
			this._activeVoices.push(sameNoteReleasingVoice)
			return sameNoteReleasingVoice
		}

		if (this._inactiveVoices.length > 0) {
			// Try to return inactive voice first
			const voice = this._inactiveVoices.shift()!
			this._activeVoices.push(voice)
			return voice
		} else if (this._releasingVoices.length > 0) {
			// Next try releasing voices
			const voice = this._releasingVoices.shift()!
			this._activeVoices.push(voice)
			return voice
		} else {
			// Lastly use active voices
			const voice = this._activeVoices.shift()!
			this._activeVoices.push(voice)
			return voice
		}
	}
}

export abstract class Voice {
	public playingNote: number = -1
	public playStartTime: number = 0
	protected _audioContext: AudioContext
	protected _destination: AudioNode
	protected _releaseId: string = ''
	protected _status: VoiceStatus = VoiceStatus.off
	protected _gain: GainNode

	constructor(audioContext: AudioContext, destination: AudioNode) {
		this._audioContext = audioContext
		this._destination = destination

		this._gain = this._audioContext.createGain()
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime)
	}

	public getReleaseId = () => this._releaseId

	public abstract playNote(note: number, attackTimeInSeconds: number): void

	public release = (timeToReleaseInSeconds: number) => {
		this._cancelAndHoldOrJustCancel()
		this._gain.gain.setValueAtTime(this._gain.gain.value, this._audioContext.currentTime)
		this._gain.gain.exponentialRampToValueAtTime(0.00001, this._audioContext.currentTime + timeToReleaseInSeconds)

		this._status = VoiceStatus.releasing
		this._releaseId = uuid.v4()
		return this._releaseId
	}

	public abstract dispose(): void

	protected _beforePlayNote(attackTimeInSeconds: number) {
		this._cancelAndHoldOrJustCancel()

		// Never go straight to 0 or you'll probably get a click sound
		this._gain.gain.linearRampToValueAtTime(0, this._audioContext.currentTime + 0.001)

		// this._gain.gain.setValueAtTime(0, this._audioContext.currentTime)
		this._gain.gain.linearRampToValueAtTime(1, this._audioContext.currentTime + attackTimeInSeconds)
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

	private readonly _cancelAndHoldOrJustCancel = () => {
		const gain = this._gain.gain as any

		// cancelAndHoldAtTime is not implemented in firefox
		if (gain.cancelAndHoldAtTime) {
			gain.cancelAndHoldAtTime(this._audioContext.currentTime)
		} else {
			gain.cancelScheduledValues(this._audioContext.currentTime)
		}
	}
}
