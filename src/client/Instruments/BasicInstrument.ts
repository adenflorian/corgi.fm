import {logger} from '../../common/logger'
import {IMidiNote} from '../../common/MidiNote'
import {getFrequencyUsingHalfStepsFromA4} from '../music/music-functions'

export interface IBasicInstrumentOptions {
	destination: any
	audioContext: AudioContext
	voiceCount: number
	oscillatorType: OscillatorType
}

export class BasicInstrument {
	private _panNode: StereoPannerNode
	private _audioContext: AudioContext
	private _gain: GainNode
	private _lowPassFilter: BiquadFilterNode
	private _previousNotes: number[] = []
	private _oscillatorType: OscillatorType
	private _attackTimeInSeconds: number = 5
	private _releaseTimeInSeconds: number = 5
	private _voices: Voices
	private _settingMidiNotes: boolean = false

	constructor(options: IBasicInstrumentOptions) {
		this._audioContext = options.audioContext

		this._panNode = this._audioContext.createStereoPanner()

		this._lowPassFilter = this._audioContext.createBiquadFilter()
		this._lowPassFilter.type = 'lowpass'
		this._lowPassFilter.frequency.value = 10000

		this._gain = this._audioContext.createGain()
		this._gain.gain.value = 1

		// this._lfo.connect(lfoGain)
		// 	.connect(this._gain.gain)

		this._panNode.connect(this._lowPassFilter)
		this._lowPassFilter.connect(this._gain)
		this._gain.connect(options.destination)

		if (module.hot) {
			module.hot.dispose(this.dispose)
		}

		this._oscillatorType = options.oscillatorType

		this._voices = new Voices(options.voiceCount, this._audioContext, options.destination, this._oscillatorType)
	}

	public setPan = (pan: number) => this._panNode.pan.setValueAtTime(pan, this._audioContext.currentTime)

	public setLowPassFilterCutoffFrequency = (frequency: number) => this._lowPassFilter.frequency.value = frequency

	public setOscillatorType = (type: OscillatorType) => this._oscillatorType = type

	public setMidiNotes = (midiNotes: IMidiNote[]) => {
		if (this._settingMidiNotes) return

		this._settingMidiNotes = true
		logger.log('setMidiNotes enter: ', midiNotes)
		const newNotes = midiNotes.filter(x => this._previousNotes.includes(x) === false)
		const offNotes = this._previousNotes.filter(x => midiNotes.includes(x) === false)

		offNotes.forEach(note => {
			this._voices.releaseNote(note, this._releaseTimeInSeconds)
		})

		newNotes.forEach(note => {
			this._voices.playNote(note, this._oscillatorType, this._attackTimeInSeconds)
		})

		this._previousNotes = midiNotes
		logger.log('setMidiNotes exit: ', midiNotes)
		this._settingMidiNotes = false
	}

	public dispose = () => undefined
}

const A4 = 69

function midiNoteToFrequency(midiNote: IMidiNote): number {
	if (midiNote === undefined) return 0

	const halfStepsFromA4 = midiNote - A4
	return getFrequencyUsingHalfStepsFromA4(halfStepsFromA4)
}

class Voices {
	private _availableVoices: Voice[] = []

	constructor(voiceCount: number, audioContext: AudioContext, destination: AudioNode, oscType: OscillatorType) {
		for (let i = 0; i < voiceCount; i++) {
			this._availableVoices.push(new Voice(audioContext, destination, oscType))
		}
	}

	public playNote(note: number, oscType: OscillatorType, attackTimeInSeconds: number) {
		logger.log('Voices.playNote: ', note)

		const voice = this._getVoice()

		voice.playNote(note, oscType, attackTimeInSeconds)
	}

	public releaseNote = (note: number, timeToReleaseInSeconds: number) => {
		logger.log('Voices.releaseNote: ', note)

		const voice = this._availableVoices.find(x => x.playingNote === note)

		if (voice) {
			voice.release(timeToReleaseInSeconds)
			this._availableVoices = this._availableVoices.filter(x => x !== voice)
			this._availableVoices.unshift(voice)
		}

	}

	private _getVoice(): Voice {
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

	constructor(audioContext: AudioContext, destination: AudioNode, oscType: OscillatorType) {
		this._audioContext = audioContext
		this._oscillator = audioContext.createOscillator()
		this._oscillator.start()
		this._oscillator.type = oscType
		this._oscillator.frequency.setValueAtTime(0, this._audioContext.currentTime)

		this._gain = audioContext.createGain()
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime)

		this._oscillator.connect(this._gain)
			.connect(destination)
	}

	public playNote(note: number, oscType: OscillatorType, attackTimeInSeconds: number) {
		this._gain.gain.cancelScheduledValues(this._audioContext.currentTime)
		// this._gain.gain.setValueAtTime(this._gain.gain.value, this._audioContext.currentTime)
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime)
		this._gain.gain.linearRampToValueAtTime(1, this._audioContext.currentTime + attackTimeInSeconds)

		this._oscillator.type = oscType
		this._oscillator.frequency.value = midiNoteToFrequency(note)

		this.playStartTime = this._audioContext.currentTime

		this.playingNote = note
	}

	public release = (timeToReleaseInSeconds: number) => {
		const gain = this._gain.gain as any
		gain.cancelAndHoldAtTime(this._audioContext.currentTime)
		this._gain.gain.setValueAtTime(this._gain.gain.value, this._audioContext.currentTime)
		const endTime = this._audioContext.currentTime + timeToReleaseInSeconds
		this._gain.gain.exponentialRampToValueAtTime(0.00001, endTime)
		// this._gain.gain.exponentialRampToValueAtTime(0.00001, endTime)
		// this._gain.gain.setValueAtTime(0, endTime + 0.001)
		// this._oscillator.frequency.setValueAtTime(0, this._audioContext.currentTime)

		this.playingNote = -1
	}

	public setOscillatorType = (oscType: OscillatorType) => {
		if (this._oscillator.type !== oscType) {
			this._oscillator.type = oscType
		}
	}

	public dispose = () => {
		this._oscillator.stop()
		this._oscillator.disconnect()
		delete this._oscillator
		this._gain.disconnect()
		delete this._gain
	}
}

// class VoicePool {
// 	private _voices: Voice[]

// 	constructor(voiceCount: number = 3, audioContext: AudioContext) {
// 		this._voices = new Array(voiceCount).fill(new Voice(audioContext))
// 	}

// 	public getVoice(): Voice {
// 		return this._voices.pop()
// 	}

// 	public returnVoice(voice: Voice) {
// 		this._voices.push(voice)
// 	}

// 	public isVoiceAvailable(): boolean {
// 		return this._voices.length > 0
// 	}
// }
