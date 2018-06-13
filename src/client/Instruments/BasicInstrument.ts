// import ADSR from 'adsr'
import Filter from 'filter'
import {IMidiNote} from '../midi/MidiNote'
import {getFrequencyUsingHalfStepsFromA4} from '../music/music-functions'

export class BasicInstrument {
	private _panNode: StereoPannerNode
	private _audioContext: AudioContext
	private _gain: GainNode
	private _oscillators: OscillatorNode[] = []
	private _voiceCount = 10
	private _lowPassFilter: AudioNode | any
	private _lfo: OscillatorNode
	// private _adsr: AudioNode | any

	constructor({destination, audioContext}: {destination: any, audioContext: AudioContext}) {
		this._audioContext = audioContext

		this._panNode = this._audioContext.createStereoPanner()

		for (let i = 0; i < this._voiceCount; i++) {
			this._oscillators[i] = this._audioContext.createOscillator()
			this._oscillators[i].type = 'sawtooth'
			this._oscillators[i].frequency.value = 0
			this._oscillators[i].connect(this._panNode)
			this._oscillators[i].start()
		}

		if (module.hot) {
			module.hot.dispose(() => {
				this._oscillators.forEach(osc => osc.stop())
				// this._oscillator.stop()
			})
		}

		this._lowPassFilter = Filter.Lowpass(this._audioContext, {frequency: 10000})

		this._lfo = audioContext.createOscillator()
		this._lfo.frequency.value = 2
		const lfoGain = audioContext.createGain()
		lfoGain.gain.value = 0.14

		this._lfo.start()

		this._gain = audioContext.createGain()

		this._lfo.connect(lfoGain)
			.connect(this._gain.gain)

		// this._adsr = ADSR(this._audioContext)
		// this._adsr.attack = 3
		// this._adsr.start(this._audioContext.currentTime)
		// this._adsr.connect(this._gain.gain)

		this._panNode.connect(this._lowPassFilter.input)
		this._lowPassFilter.connect(this._gain)
		this._gain.connect(destination)
	}

	public setPan(pan: number) {
		this._panNode.pan.setValueAtTime(pan, this._audioContext.currentTime)
	}

	public setMidiNotes = (midiNotes: IMidiNote[]) => {
		// const frequency: number = this._getFrequencyFromMidiNotes(midiNotes) || 0
		// this._oscillator.frequency.value = frequency

		let highestFrequency = 0

		this._oscillators.forEach((oscillator, index) => {
			oscillator.frequency.value = midiNoteToFrequency(midiNotes[index])
			if (oscillator.frequency.value > highestFrequency) {
				highestFrequency = oscillator.frequency.value
			}
		})

		this._lfo.frequency.value = (highestFrequency / 100) + 1

		// let adjustedMidiNotes

		// if (midiNotes.length >= this._oscillators.length) {
		// 	this._oscillators
		// } else if (midiNotes.length < this._voiceCount) {
		// 	const notesToAdd = this._voiceCount - midiNotes.length
		// 	adjustedMidiNotes = midiNotes
		// 	for (let i = 0; i < notesToAdd; i++) {
		// 		const element = array[i]
		// 		adjustedMidiNotes.push(0)
		// 	}
		// 	adjustedMidiNotes
		// } else {
		// 	adjustedMidiNotes = midiNotes
		// }

	}

	public setOscillatorType = (type: OscillatorType) => {
		// this._oscillator.type = type
		this._oscillators.forEach(osc => {
			osc.type = type
		})
	}

	// private _getFrequencyFromMidiNotes(midiNotes: IMidiNote[]): number {
	// 	return !midiNotes || midiNotes.length === 0
	// 		? 0
	// 		: midiNoteToFrequency(midiNotes[midiNotes.length - 1])
	// }
}

const A4 = 69

function midiNoteToFrequency(midiNote: IMidiNote): number {
	if (midiNote === undefined) return 0

	const halfStepsFromA4 = midiNote - A4
	return getFrequencyUsingHalfStepsFromA4(halfStepsFromA4)
}
