import {setTimeout} from 'timers'
import * as uuid from 'uuid'
import {IMidiNote} from '../../common/MidiNote'
import {Arp} from '../arp'
import {getFrequencyUsingHalfStepsFromA4} from '../music/music-functions'
import {BuiltInOscillatorType, CustomOscillatorType, ShamuOscillatorType} from './OscillatorTypes'

export interface IBasicInstrumentOptions {
	destination: any
	audioContext: AudioContext
	voiceCount: number
	oscillatorType: ShamuOscillatorType
}

export class BasicInstrument {
	private _panNode: StereoPannerNode
	private _audioContext: AudioContext
	private _gain: GainNode
	private _lowPassFilter: BiquadFilterNode
	private _previousNotes: number[] = []
	private _attackTimeInSeconds: number = 0.01
	private _releaseTimeInSeconds: number = 3
	private _voices: Voices
	private _arp = new Arp()

	constructor(options: IBasicInstrumentOptions) {
		this._audioContext = options.audioContext

		this._panNode = this._audioContext.createStereoPanner()

		this._lowPassFilter = this._audioContext.createBiquadFilter()
		this._lowPassFilter.type = 'lowpass'
		this._lowPassFilter.frequency.value = 10000

		this._gain = this._audioContext.createGain()
		this._gain.gain.value = 1

		// this._arp.start(this._setMidiNotesFromArp)

		// this._lfo.connect(lfoGain)
		// 	.connect(this._gain.gain)

		this._panNode.connect(this._lowPassFilter)
		this._lowPassFilter.connect(this._gain)
		this._gain.connect(options.destination)

		if (module.hot) {
			module.hot.dispose(this.dispose)
		}

		this._voices = new Voices(options.voiceCount, this._audioContext, this._panNode, options.oscillatorType)
	}

	public setPan = (pan: number) => this._panNode.pan.setValueAtTime(pan, this._audioContext.currentTime)

	public setLowPassFilterCutoffFrequency = (frequency: number) =>
		this._lowPassFilter.frequency.setValueAtTime(frequency, this._audioContext.currentTime)

	public setOscillatorType = (type: ShamuOscillatorType) => {
		this._voices.setOscillatorType(type)
	}

	public setAttack = (attackTimeInSeconds: number) => this._attackTimeInSeconds = attackTimeInSeconds

	public setRelease = (releaseTimeInSeconds: number) => this._releaseTimeInSeconds = releaseTimeInSeconds

	public setMidiNotes = (midiNotes: IMidiNote[]) => {
		const arp = false

		if (arp) {
			this._arp.setNotes(midiNotes)
		} else {
			this._setMidiNotesFromArp(midiNotes)
		}
	}

	public dispose = () => {
		this._panNode.disconnect()
		delete this._panNode
		this._gain.disconnect()
		delete this._gain
		this._lowPassFilter.disconnect()
		delete this._lowPassFilter
		this._voices.dispose()
		this._arp.dispose()
	}

	private _setMidiNotesFromArp = (midiNotes: IMidiNote[]) => {
		const newNotes = midiNotes.filter(x => this._previousNotes.includes(x) === false)
		const offNotes = this._previousNotes.filter(x => midiNotes.includes(x) === false)

		offNotes.forEach(note => {
			this._voices.releaseNote(note, this._releaseTimeInSeconds)
		})

		newNotes.forEach(note => {
			this._voices.playNote(note, this._attackTimeInSeconds)
		})

		this._previousNotes = midiNotes
	}
}

const A4 = 69

function midiNoteToFrequency(midiNote: IMidiNote): number {
	if (midiNote === undefined) return 0

	const halfStepsFromA4 = midiNote - A4
	return getFrequencyUsingHalfStepsFromA4(halfStepsFromA4)
}

class Voices {
	private _inactiveVoices: Voice[] = []
	private _activeVoices: Voice[] = []
	private _releasingVoices: Voice[] = []

	constructor(voiceCount: number, audioContext: AudioContext, destination: AudioNode, oscType: ShamuOscillatorType) {
		for (let i = 0; i < voiceCount; i++) {
			this._inactiveVoices.push(new Voice(audioContext, destination, oscType))
		}
	}

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

	public setOscillatorType(type: ShamuOscillatorType) {
		this._activeVoices
			.concat(this._releasingVoices)
			.concat(this._inactiveVoices)
			.forEach(x => x.setOscillatorType(type))
	}

	public dispose() {
		this._inactiveVoices.forEach(x => x.dispose())
	}

	private _getVoice(note: number): Voice {
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

class Voice {
	public playingNote: number = -1
	public playStartTime: number = 0
	private _oscillator: OscillatorNode
	private _gain: GainNode
	private _audioContext: AudioContext
	private _oscillatorType: ShamuOscillatorType
	private _nextOscillatorType: ShamuOscillatorType
	private _destination: AudioNode
	private _whiteNoise: AudioBufferSourceNode
	private _noiseBuffer: AudioBuffer
	private _releaseId: string
	private _status: VoiceStatus = VoiceStatus.off

	constructor(audioContext: AudioContext, destination: AudioNode, oscType: ShamuOscillatorType) {
		this._audioContext = audioContext
		this._destination = destination
		this._oscillatorType = oscType
		this._gain = this._audioContext.createGain()
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime)

		this._generateNoiseBuffer()

		this._buildChain()
	}

	public getReleaseId = () => this._releaseId

	public playNote(note: number, attackTimeInSeconds: number) {
		this._cancelAndHoldOrJustCancel()
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime)
		this._gain.gain.linearRampToValueAtTime(1, this._audioContext.currentTime + attackTimeInSeconds)

		this._oscillator.frequency.value = midiNoteToFrequency(note)

		this._refreshOscillatorType()

		this.playStartTime = this._audioContext.currentTime

		this.playingNote = note
		this._status = VoiceStatus.playing
	}

	public release = (timeToReleaseInSeconds: number) => {
		this._cancelAndHoldOrJustCancel()
		this._gain.gain.setValueAtTime(this._gain.gain.value, this._audioContext.currentTime)
		this._gain.gain.exponentialRampToValueAtTime(0.00001, this._audioContext.currentTime + timeToReleaseInSeconds)

		this._status = VoiceStatus.releasing
		this._releaseId = uuid.v4()
		return this._releaseId
	}

	public setOscillatorType = (newOscType: ShamuOscillatorType) => {
		this._nextOscillatorType = newOscType

		if (this._status === VoiceStatus.playing) {
			this._refreshOscillatorType()
		}
	}

	public _refreshOscillatorType = () => {
		if (this._oscillatorType !== this._nextOscillatorType) {
			const oldOscType = this._oscillatorType
			this._oscillatorType = this._nextOscillatorType

			if (this._oscillatorType in BuiltInOscillatorType && oldOscType in BuiltInOscillatorType) {
				this._oscillator.type = this._oscillatorType as OscillatorType
			} else {
				this._rebuildChain()
			}
		}
	}

	public dispose = () => {
		this._deleteChain()
		this._gain.disconnect()
		delete this._gain
	}

	private _rebuildChain() {
		this._deleteChain()
		this._buildChain()
	}

	private _generateNoiseBuffer() {
		const bufferSize = 2 * this._audioContext.sampleRate
		this._noiseBuffer = this._audioContext.createBuffer(1, bufferSize, this._audioContext.sampleRate)
		const output = this._noiseBuffer.getChannelData(0)

		for (let i = 0; i < bufferSize; i++) {
			output[i] = Math.random() * 2 - 1
		}
	}

	private _buildChain() {
		this._oscillator = this._audioContext.createOscillator()
		this._oscillator.start()
		this._whiteNoise = this._audioContext.createBufferSource()
		this._whiteNoise.start()

		this._buildSpecificChain().connect(this._gain)
			.connect(this._destination)
	}

	private _buildSpecificChain(): AudioNode {
		if (this._oscillatorType === CustomOscillatorType.noise) {
			return this._buildNoiseChain()
		} else {
			return this._buildNormalChain()
		}
	}

	private _buildNoiseChain(): AudioNode {
		this._whiteNoise.buffer = this._noiseBuffer
		this._whiteNoise.loop = true

		return this._whiteNoise
	}

	private _buildNormalChain(): AudioNode {
		this._oscillator.type = this._oscillatorType as OscillatorType
		this._oscillator.frequency.setValueAtTime(midiNoteToFrequency(this.playingNote), this._audioContext.currentTime)

		return this._oscillator
	}

	private _deleteChain() {
		this._oscillator.stop()
		this._oscillator.disconnect()
		delete this._oscillator
		this._whiteNoise.stop()
		this._whiteNoise.disconnect()
		delete this._whiteNoise
	}

	private _cancelAndHoldOrJustCancel = () => {
		const gain = this._gain.gain as any
		// cancelAndHoldAtTime is not implemented in firefox
		if (gain.cancelAndHoldAtTime) {
			gain.cancelAndHoldAtTime(this._audioContext.currentTime)
		} else {
			gain.cancelScheduledValues(this._audioContext.currentTime)
		}
	}
}

enum VoiceStatus {
	playing,
	releasing,
	off,
}
