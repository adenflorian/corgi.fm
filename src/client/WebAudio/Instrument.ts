import {List, Map, OrderedMap} from 'immutable'
import uuid = require('uuid')
import {IDisposable} from '../../common/common-types'
import {logger} from '../../common/logger'
import {emptyMidiNotes, IMidiNotes, IMidiNote} from '../../common/MidiNote'
import {Arp} from './arp'

export interface IAudioNodeWrapperOptions {
	audioContext: AudioContext
	id: string
}

export abstract class AudioNodeWrapper {
	public abstract dispose: () => void
	public readonly id: string
	protected abstract getInputAudioNode: () => AudioNode | null
	protected abstract getOutputAudioNode: () => AudioNode | null
	protected readonly _audioContext: AudioContext
	private _connectedTargets = Map<string, AudioNodeWrapper>()

	constructor(options: IAudioNodeWrapperOptions) {
		this.id = options.id
		this._audioContext = options.audioContext
	}

	public readonly getConnectedTargets = () => this._connectedTargets

	public readonly connect = (destination: AudioNodeWrapper, targetId: string) => {
		if (this._connectedTargets.has(targetId)) return

		// TODO Prevent feedback loop

		const outputAudioNode = this.getOutputAudioNode()

		if (!outputAudioNode) return

		const inputAudioNode = destination.getInputAudioNode()

		if (!inputAudioNode) return

		this._connectedTargets = this._connectedTargets.set(targetId, destination)

		if (detectFeedbackLoop(this)) {
			logger.warn('Feedback loop detected, preventing connection')
			return
		}

		outputAudioNode.connect(inputAudioNode)
		// logger.debug('AudioNodeWrapper.connect targetId: ', targetId)
	}

	public readonly disconnect = (targetId: string) => {
		if (this._connectedTargets.count() === 0) return

		const targetToDisconnect = this._connectedTargets.get(targetId)

		if (!targetToDisconnect) return

		this._connectedTargets = this._connectedTargets.delete(targetId)

		const audioNodeToDisconnect = targetToDisconnect.getInputAudioNode()

		if (!audioNodeToDisconnect) return

		const output = this.getOutputAudioNode()

		if (!output) return

		try {
			output.disconnect(audioNodeToDisconnect)
		} catch (e) {
			if (e instanceof Error && e.message.includes('the given destination is not connected')) {
				// Do nothing, this is expected in prevented feedback loop situations
			} else {
				throw new Error(e)
			}
		}
	}

	public readonly disconnectAll = () => {
		if (this._connectedTargets.count() === 0) return

		this._connectedTargets = this._connectedTargets.clear()

		const output = this.getOutputAudioNode()

		if (!output) return

		output.disconnect()
	}
}

function detectFeedbackLoop(nodeWrapper: AudioNodeWrapper, i = 0, nodeIds: List<string> = List<string>()): boolean {
	if (nodeIds.contains(nodeWrapper.id)) return true
	if (i > 500) return true

	const netNodeIds = nodeIds.push(nodeWrapper.id)

	if (nodeWrapper.getConnectedTargets().count() === 0) return false

	return nodeWrapper.getConnectedTargets().some(x => {
		return detectFeedbackLoop(x, i + 1, nodeIds)
	})
}

interface MasterAudioOutputOptions extends IAudioNodeWrapperOptions {
	audioNode: AudioNode
}

export class MasterAudioOutput extends AudioNodeWrapper {
	private readonly _audioNode: AudioNode

	constructor(options: MasterAudioOutputOptions) {
		super(options)
		this._audioNode = options.audioNode
	}

	public readonly getInputAudioNode = () => this._audioNode
	public readonly getOutputAudioNode = () => null
	public readonly dispose = () => undefined
}

export interface IInstrument extends IDisposable, AudioNodeWrapper {
	setMidiNotes: (midiNotes: IMidiNotes) => void
	setPan: (pan: number) => void
	setLowPassFilterCutoffFrequency: (frequency: number) => void
	setAttack: (attackTimeInSeconds: number) => void
	setRelease: (releaseTimeInSeconds: number) => void
	getActivityLevel: () => number
	scheduleNote(note: IMidiNote, delaySeconds: number): void
	scheduleRelease(note: number, delaySeconds: number): void
}

// TODO Default generic types to {} or something so that w dont need to use the interface
export abstract class Instrument<T extends Voices<V>, V extends Voice> extends AudioNodeWrapper implements IInstrument {

	protected readonly _panNode: StereoPannerNode
	protected readonly _audioContext: AudioContext
	protected readonly _lowPassFilter: BiquadFilterNode
	protected _attackTimeInSeconds: number = 0.01
	protected _releaseTimeInSeconds: number = 3
	private readonly _arp = new Arp()
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

		// this._arp.start(this._setMidiNotesFromArp)

		// this._lfo.connect(lfoGain)
		// 	.connect(this._gain.gain)

		this._panNode.connect(this._lowPassFilter)
		this._lowPassFilter.connect(this._gain)
	}
	public abstract scheduleNote(note: IMidiNote, delaySeconds: number): void
	public abstract scheduleRelease(note: number, delaySeconds: number): void

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
		const arp = false

		if (arp) {
			this._arp.setNotes(midiNotes)
		} else {
			this._setMidiNotesFromArp(midiNotes)
		}
	}

	public readonly setAttack = (attackTimeInSeconds: number) => this._attackTimeInSeconds = attackTimeInSeconds

	public readonly setRelease = (releaseTimeInSeconds: number) => this._releaseTimeInSeconds = releaseTimeInSeconds

	public readonly getActivityLevel = () => this._getVoices().getActivityLevel()

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

	public getActivityLevel = () => {
		if (this._activeVoices.count() > 0) return 1
		if (this._releasingVoices.count() > 0) return 0.5
		return 0
	}

	public dispose() {
		this._allVoices.forEach(x => x.dispose())
	}

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
}

export abstract class Voice {
	public playingNote: number = -1
	public playStartTime: number = 0
	public readonly id: number
	protected _audioContext: AudioContext
	protected _destination: AudioNode
	protected _releaseId: string = ''
	protected _status: VoiceStatus = VoiceStatus.off
	protected _gain: GainNode

	protected static _nextId = 0

	constructor(audioContext: AudioContext, destination: AudioNode) {
		this.id = Voice._nextId++
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
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime + timeToReleaseInSeconds)

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

	protected readonly _cancelAndHoldOrJustCancel = (delaySeconds = 0) => {
		const gain = this._gain.gain as any

		const cancelTimeSeconds = this._audioContext.currentTime + delaySeconds

		// cancelAndHoldAtTime is not implemented in firefox
		if (gain.cancelAndHoldAtTime) {
			gain.cancelAndHoldAtTime(cancelTimeSeconds)
		} else {
			gain.cancelScheduledValues(cancelTimeSeconds)
		}
	}
}
