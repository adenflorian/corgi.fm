import {IMidiNote} from '../../common/MidiNote'
import {Arp} from '../arp'
import {getFrequencyUsingHalfStepsFromA4} from '../music/music-functions'

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
	private _oscillatorType: ShamuOscillatorType
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

		this._oscillatorType = options.oscillatorType

		this._voices = new Voices(options.voiceCount, this._audioContext, this._panNode, this._oscillatorType)
	}

	public setPan = (pan: number) => this._panNode.pan.setValueAtTime(pan, this._audioContext.currentTime)

	public setLowPassFilterCutoffFrequency = (frequency: number) =>
		this._lowPassFilter.frequency.setValueAtTime(frequency, this._audioContext.currentTime)

	public setOscillatorType = (type: ShamuOscillatorType) => {
		this._oscillatorType = type
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

	public dispose = () => undefined

	private _setMidiNotesFromArp = (midiNotes: IMidiNote[]) => {
		const newNotes = midiNotes.filter(x => this._previousNotes.includes(x) === false)
		const offNotes = this._previousNotes.filter(x => midiNotes.includes(x) === false)

		offNotes.forEach(note => {
			this._voices.releaseNote(note, this._releaseTimeInSeconds)
		})

		newNotes.forEach(note => {
			this._voices.playNote(note, this._oscillatorType, this._attackTimeInSeconds)
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
	private _availableVoices: Voice[] = []

	constructor(voiceCount: number, audioContext: AudioContext, destination: AudioNode, oscType: ShamuOscillatorType) {
		for (let i = 0; i < voiceCount; i++) {
			this._availableVoices.push(new Voice(audioContext, destination, oscType))
		}
	}

	public playNote(note: number, oscType: ShamuOscillatorType, attackTimeInSeconds: number) {
		const voice = this._getVoice()

		voice.playNote(note, oscType, attackTimeInSeconds)
	}

	public releaseNote = (note: number, timeToReleaseInSeconds: number) => {
		const voice = this._availableVoices.find(x => x.playingNote === note)

		if (voice) {
			voice.release(timeToReleaseInSeconds)
			// this._availableVoices = this._availableVoices.filter(x => x !== voice)
			// this._availableVoices.unshift(voice)
		}
	}

	public setOscillatorType(type: ShamuOscillatorType) {
		this._availableVoices.forEach(x => x.setOscillatorType(type))
	}

	private _getVoice(): Voice {
		// TODO Pick voice that was played last
		const voice = this._availableVoices.shift()
		this._availableVoices.push(voice)
		return voice
	}
}

class Voice {
	public playingNote: number = -1
	public playStartTime: number = 0
	private _oscillator: OscillatorNode
	private _gain: GainNode
	private _audioContext: AudioContext
	private _oscillatorType: ShamuOscillatorType
	private _destination: AudioNode

	constructor(audioContext: AudioContext, destination: AudioNode, oscType: ShamuOscillatorType) {
		this._audioContext = audioContext
		this._destination = destination
		this._oscillatorType = oscType

		this._buildChain()
	}

	public playNote(note: number, oscType: ShamuOscillatorType, attackTimeInSeconds: number) {
		this._cancelAndHoldOrJustCancel()
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime)
		this._gain.gain.linearRampToValueAtTime(1, this._audioContext.currentTime + attackTimeInSeconds)

		// this._oscillator.type = oscType
		this._oscillator.frequency.value = midiNoteToFrequency(note)

		this.playStartTime = this._audioContext.currentTime

		this.playingNote = note
	}

	public release = (timeToReleaseInSeconds: number) => {
		this._cancelAndHoldOrJustCancel()
		this._gain.gain.setValueAtTime(this._gain.gain.value, this._audioContext.currentTime)
		this._gain.gain.exponentialRampToValueAtTime(0.00001, this._audioContext.currentTime + timeToReleaseInSeconds)

		this.playingNote = -1
	}

	public setOscillatorType = (newOscType: ShamuOscillatorType) => {
		if (this._oscillatorType !== newOscType) {
			this._oscillatorType = newOscType

			if (newOscType in BuiltInOscillatorType) {
				this._oscillator.type = newOscType as OscillatorType
			} else {
				this._deleteChain()
				this._buildChain()
			}
		}
	}

	public dispose = () => {
		this._deleteChain()
	}

	private _buildChain() {
		this._oscillator = this._audioContext.createOscillator()
		if (this._oscillatorType === CustomOscillatorType.noise) {
			this._buildNoiseChain()
		} else {
			this._buildNormalChain()
		}
	}

	private _buildNoiseChain() {
		const bufferSize = 2 * this._audioContext.sampleRate
		const noiseBuffer = this._audioContext.createBuffer(1, bufferSize, this._audioContext.sampleRate)
		const output = noiseBuffer.getChannelData(0)

		for (let i = 0; i < bufferSize; i++) {
			output[i] = Math.random() * 2 - 1
		}

		const whiteNoise = this._audioContext.createBufferSource()
		whiteNoise.buffer = noiseBuffer
		whiteNoise.loop = true
		whiteNoise.start(0)

		this._gain = this._audioContext.createGain()
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime)

		whiteNoise.connect(this._gain)
			.connect(this._destination)
	}

	private _buildNormalChain() {
		this._oscillator.start()
		this._oscillator.type = this._oscillatorType as OscillatorType
		this._oscillator.frequency.setValueAtTime(0, this._audioContext.currentTime)

		this._gain = this._audioContext.createGain()
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime)

		this._oscillator.connect(this._gain)
			.connect(this._destination)
	}

	private _deleteChain() {
		this._oscillator.stop()
		this._oscillator.disconnect()
		delete this._oscillator
		this._gain.disconnect()
		delete this._gain
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

export type ShamuOscillatorType = BuiltInOscillatorType | CustomOscillatorType.noise

export enum BuiltInOscillatorType {
	sine = 'sine',
	square = 'square',
	sawtooth = 'sawtooth',
	triangle = 'triangle',
}

export enum CustomOscillatorType {
	noise = 'noise',
}
