import {IMidiNote} from './MidiNote'
import {getFrequencyUsingHalfStepsFromA4} from './redux/input-middleware'

export class BasicInstrument {
	private _panNode: StereoPannerNode
	private _oscillator: OscillatorNode
	private _audioContext: AudioContext

	constructor({destination, audioContext}: {destination: any, audioContext: AudioContext}) {
		this._audioContext = audioContext

		this._panNode = this._audioContext.createStereoPanner()

		this._oscillator = this._audioContext.createOscillator()
		this._oscillator.type = 'square'
		this._oscillator.frequency.value = 0

		this._oscillator.connect(this._panNode)
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
