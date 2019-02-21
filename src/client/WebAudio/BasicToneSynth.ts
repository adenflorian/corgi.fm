import {Frequency, Synth} from 'tone'
import {emptyMidiNotes, IMidiNote, IMidiNotes} from '../../common/MidiNote'

export class BasicToneSynth {
	private readonly _synth: Synth = new Synth().toMaster()
	private _previousNotes = emptyMidiNotes
	private _previousNote: IMidiNote | null = null

	constructor() {
		// this._synth.volume
	}

	public setMidiNotes(midiNotes: IMidiNotes) {
		const newNotes = midiNotes.filter(x => this._previousNotes.includes(x) === false)
		const offNotes = this._previousNotes.filter(x => midiNotes.includes(x) === false)

		const currentNote = midiNotes.last(null)

		if (currentNote) {
			if (currentNote !== this._previousNote) {
				this._synth.triggerAttack(Frequency(currentNote, 'midi'))
			}
		} else {
			this._synth.triggerRelease()
		}

		this._previousNotes = midiNotes
		this._previousNote = currentNote
	}
}
