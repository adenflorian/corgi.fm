// import ADSR from 'adsr'
import {IMidiNote} from '../../common/MidiNote'
import {getFrequencyUsingHalfStepsFromA4} from '../music/music-functions'

export class BasicInstrument {
	private _panNode: StereoPannerNode
	private _audioContext: AudioContext
	private _gain: GainNode
	// private _voiceCount = 10
	private _lowPassFilter: BiquadFilterNode
	private _previousNotes: number[] = []
	private _noteToOscillatorMap: Map<number, OscillatorNode> = new Map()
	private _oscillatorType: OscillatorType

	constructor({destination, audioContext}: {destination: any, audioContext: AudioContext}) {
		this._audioContext = audioContext

		this._panNode = this._audioContext.createStereoPanner()

		this._lowPassFilter = this._audioContext.createBiquadFilter()
		this._lowPassFilter.type = 'lowpass'
		this._lowPassFilter.frequency.value = 10000

		this._gain = audioContext.createGain()
		this._gain.gain.value = 1

		// this._lfo.connect(lfoGain)
		// 	.connect(this._gain.gain)

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

	public setLowPassFilterCutoffFrequency(frequency: number) {
		this._lowPassFilter.frequency.value = frequency
	}

	public setMidiNotes = (midiNotes: IMidiNote[]) => {
		const newNotes = midiNotes.filter(x => this._previousNotes.includes(x) === false)
		const offNotes = this._previousNotes.filter(x => midiNotes.includes(x) === false)

		newNotes.forEach(note => {
			const newOsc = this._audioContext.createOscillator()
			this._noteToOscillatorMap.set(note, newOsc)
			newOsc.type = this._oscillatorType
			newOsc.frequency.value = midiNoteToFrequency(note)
			newOsc.connect(this._panNode)
			newOsc.start()
		})

		offNotes.forEach(note => {
			const oldOsc = this._noteToOscillatorMap.get(note)
			oldOsc.stop()
			oldOsc.disconnect()
			this._noteToOscillatorMap.delete(note)
		})

		this._previousNotes = midiNotes
	}

	public setOscillatorType = (type: OscillatorType) => {
		this._oscillatorType = type
	}

	public dispose() {
		this._noteToOscillatorMap.forEach(osc => {
			osc.stop()
			osc.disconnect()
		})
	}

	// private _initAdsr() {
	// 	if (this._adsr) {
	// 		this._adsr.stop(this._audioContext.currentTime)
	// 		this._adsr.disconnect()
	// 	}
	// 	this._adsr = ADSR(this._audioContext)
	// 	this._adsr.connect(this._gain.gain)
	// 	this._adsr.attack = 0.01
	// 	this._adsr.decay = 0.4
	// 	this._adsr.sustain = 0
	// 	this._adsr.release = 0
	// 	this._adsr.value.value = 2
	// 	this._adsr.start(this._audioContext.currentTime)
	// }
}

const A4 = 69

function midiNoteToFrequency(midiNote: IMidiNote): number {
	if (midiNote === undefined) return 0

	const halfStepsFromA4 = midiNote - A4
	return getFrequencyUsingHalfStepsFromA4(halfStepsFromA4)
}

// class Voice {
// 	private _oscillator: OscillatorNode
// 	private _gain: GainNode
// }
