// import ADSR from 'adsr'
import {IMidiNote} from '../../common/MidiNote'
import {getFrequencyUsingHalfStepsFromA4} from '../music/music-functions'

export class BasicInstrument {
	private _panNode: StereoPannerNode
	private _audioContext: AudioContext
	private _gain: GainNode
	private _oscillators: OscillatorNode[] = []
	private _voiceCount = 10
	private _lowPassFilter: BiquadFilterNode
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

		this._lowPassFilter = this._audioContext.createBiquadFilter()
		this._lowPassFilter.type = 'lowpass'
		this._lowPassFilter.frequency.value = 10000

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

		this._panNode.connect(this._lowPassFilter)
		this._lowPassFilter.connect(this._gain)
		this._gain.connect(destination)

		if (module.hot) {
			module.hot.dispose(this.dispose)
		}
	}

	public setPan(pan: number) {
		this._panNode.pan.setValueAtTime(pan, this._audioContext.currentTime)
	}

	public setMidiNotes = (midiNotes: IMidiNote[]) => {
		// const frequency: number = this._getFrequencyFromMidiNotes(midiNotes) || 0
		// this._oscillator.frequency.value = frequency

		let highestFrequency = 0

		// TODO: Find oscillator that's at desired freq and use it,
		//   or store state of pressed midi notes and only do things for changed notes

		this._oscillators.forEach((oscillator, index) => {
			const newFrequency = midiNoteToFrequency(midiNotes[index])

			// oscillator.frequency.linearRampToValueAtTime(newFrequency, this._audioContext.currentTime + 0.01)

			if (oscillator.frequency.value !== newFrequency) {
				oscillator.frequency.value = newFrequency
			}

			if (newFrequency > highestFrequency) {
				highestFrequency = newFrequency
			}
		})

		this._lfo.frequency.linearRampToValueAtTime((highestFrequency / 100) + 1, this._audioContext.currentTime + 0.01)

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
		this._oscillators.forEach(osc => {
			if (osc.type !== type) {
				osc.type = type
			}
		})
	}

	// private _getFrequencyFromMidiNotes(midiNotes: IMidiNote[]): number {
	// 	return !midiNotes || midiNotes.length === 0
	// 		? 0
	// 		: midiNoteToFrequency(midiNotes[midiNotes.length - 1])
	// }

	public dispose() {
		this._oscillators.forEach(osc => osc.stop())
		this._lfo.stop()
	}
}

const A4 = 69

function midiNoteToFrequency(midiNote: IMidiNote): number {
	if (midiNote === undefined) return 0

	const halfStepsFromA4 = midiNote - A4
	return getFrequencyUsingHalfStepsFromA4(halfStepsFromA4)
}
