import {IMidiNote} from './MidiNote'
import {getFrequencyUsingHalfStepsFromA4} from './redux/input-middleware'

export class BasicInstrument {
	private _panNode: StereoPannerNode
	private _oscillator: OscillatorNode
	private _audioContext: AudioContext
	private _gain: GainNode
	private _delay: DelayNode
	private _delayGain: GainNode
	private _reverb: ConvolverNode
	private _oscillators: OscillatorNode[] = []
	private _voiceCount = 10

	constructor({destination, audioContext}: {destination: any, audioContext: AudioContext}) {
		this._audioContext = audioContext

		this._panNode = this._audioContext.createStereoPanner()

		for (let i = 0; i < this._voiceCount; i++) {
			this._oscillators[i] = this._audioContext.createOscillator()
			this._oscillators[i].start()
		}

		if (module.hot) {
			module.hot.dispose(() => {
				this._oscillators.forEach(osc => osc.stop())
				this._oscillator.stop()
			})
		}

		this._oscillator = this._audioContext.createOscillator()
		this._oscillator.type = 'sawtooth'
		this._oscillator.frequency.value = 0

		this._gain = audioContext.createGain()

		this._delay = audioContext.createDelay(10.0)
		this._delayGain = audioContext.createGain()
		this._delayGain.gain.setValueAtTime(0.5, audioContext.currentTime)

		this._delay.delayTime.setValueAtTime(0.05, audioContext.currentTime)

		this._reverb = audioContext.createConvolver()

		this._oscillator.connect(this._panNode)
		this._panNode.connect(this._delay)
		this._delay.connect(this._delayGain)
			.connect(this._gain)

		this._panNode.connect(this._gain)
			// .connect(this._reverb)
			.connect(destination)

		this._oscillator.start()
	}

	public setPan(pan: number) {
		this._panNode.pan.setValueAtTime(pan, this._audioContext.currentTime)
	}

	public setMidiNotes = (midiNotes: IMidiNote[]) => {
		const frequency: number = this._getFrequencyFromMidiNotes(midiNotes) || 0
		this._oscillator.frequency.value = frequency
	}

	private _getFrequencyFromMidiNotes(midiNotes: IMidiNote[]): number {
		return !midiNotes || midiNotes.length === 0
			? 0
			: midiNoteToFrequency(midiNotes[midiNotes.length - 1])
	}
}

const A4 = 69

function midiNoteToFrequency(midiNote: IMidiNote): number {
	const halfStepsFromA4 = midiNote - A4
	return getFrequencyUsingHalfStepsFromA4(halfStepsFromA4)
}
