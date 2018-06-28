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
	private _attackTimeInSeconds: number = 0.01
	private _releaseTimeInSeconds: number = 2
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
	private _noteToVoiceMap: Map<number, Voice> = new Map()
	private _notePlayOrder: number[] = []
	private _audioContext: AudioContext

	constructor(voiceCount: number, audioContext: AudioContext, destination: AudioNode, oscType: OscillatorType) {
		this._audioContext = audioContext
		for (let i = 0; i < voiceCount; i++) {
			this._availableVoices.push(new Voice(audioContext, destination, oscType))
		}
	}

	public playNote(note: number, oscType: OscillatorType, attackTimeInSeconds: number) {
		logger.log('Voices.playNote: ', note)
		logger.log('Voices.playNote this._notePlayOrder: ', this._notePlayOrder)
		logger.log('Voices.playNote this._noteToVoiceMap: ', this._noteToVoiceMap)
		const voice = this._getVoice()

		this._noteToVoiceMap.set(note, voice)

		this._notePlayOrder.push(note)

		if (this._notePlayOrder.length > 3) {
			throw new Error('ggggggggggg')
		}

		voice.playNote(note, oscType, attackTimeInSeconds)
	}

	public releaseNote = (note: number, timeToReleaseInSeconds: number) => {
		logger.log('Voices.releaseNote: ', note)
		logger.log('Voices.releaseNote: ', this._noteToVoiceMap)

		if (this._noteToVoiceMap.has(note) === false) return

		logger.log('Voices.releaseNote2')

		const voice = this._noteToVoiceMap.get(note) as Voice

		logger.log('Voices.releaseNote voice: ', voice)

		voice.release(timeToReleaseInSeconds)

		const releasedNotePlayStartTime = voice.playStartTime

		setTimeout(() => {
			logger.log('Voices.releaseNote after timeout: ', this._noteToVoiceMap)
			logger.log('Voices.releaseNote after timeout: ', this._noteToVoiceMap.has(note))
			logger.log('Voices.releaseNote after timeout releasedNotePlayStartTime: ', releasedNotePlayStartTime)
			logger.log('Voices.releaseNote after timeout voice.playStartTime: ', voice.playStartTime)
			logger.log('Voices.releaseNote after timeout this._noteToVoiceMap.get(note): ', this._noteToVoiceMap.get(note))
			if (this._noteToVoiceMap.has(note) === false) return
			logger.log('8888888', voice)
			const currentVoice = this._noteToVoiceMap.get(note)
			if (releasedNotePlayStartTime !== currentVoice.playStartTime) return
			logger.log('9999999', voice)
			this._availableVoices.push(voice)
			this._noteToVoiceMap.delete(note)
			this._notePlayOrder = this._notePlayOrder.filter(x => x !== note)
		}, timeToReleaseInSeconds * 1000)
	}

	private _getVoice(): Voice {
		if (this._availableVoices.length > 0) {
			logger.log('pop')
			logger.log('pop this._availableVoices: ', this._availableVoices)
			return this._availableVoices.pop()
		} else {
			logger.log('steal')
			if (this._notePlayOrder.length > 3) {
				throw new Error('asdadasdads')
			}
			const note = this._notePlayOrder[0]
			logger.log('steal note: ', note)
			logger.log('steal this._notePlayOrder before: ', this._notePlayOrder)
			this._notePlayOrder = this._notePlayOrder.slice(1)
			logger.log('steal this._notePlayOrder after: ', this._notePlayOrder)
			const voice = this._noteToVoiceMap.get(note)
			this._noteToVoiceMap.delete(note)
			return voice
		}
	}
}

class Voice {
	public playStartTime: number = 0
	private _oscillator: OscillatorNode
	private _gain: GainNode | any
	private _audioContext: AudioContext

	constructor(audioContext: AudioContext, destination: AudioNode, oscType: OscillatorType) {
		this._audioContext = audioContext
		this._oscillator = audioContext.createOscillator()
		this._oscillator.start()
		this._oscillator.type = oscType
		this._oscillator.frequency.setValueAtTime(0, this._audioContext.currentTime)

		this._gain = audioContext.createGain()

		this._oscillator.connect(this._gain)
			.connect(destination)
	}

	public playNote(note: number, oscType: OscillatorType, attackTimeInSeconds: number) {
		this._gain.gain.setValueAtTime(0, this._audioContext.currentTime)
		this._gain.gain.linearRampToValueAtTime(1, this._audioContext.currentTime + attackTimeInSeconds)

		this._oscillator.type = oscType
		this._oscillator.frequency.value = midiNoteToFrequency(note)

		this.playStartTime = this._audioContext.currentTime
	}

	public release = (timeToReleaseInSeconds: number) => {
		// this._gain.gain.cancelAndHoldAtTime(this._audioContext.currentTime)
		// const endTime = this._audioContext.currentTime + timeToReleaseInSeconds
		// this._gain.gain.exponentialRampToValueAtTime(0.00001, endTime)
		// this._gain.gain.setValueAtTime(0, endTime + 0.001)
		this._oscillator.frequency.setValueAtTime(0, this._audioContext.currentTime)
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
