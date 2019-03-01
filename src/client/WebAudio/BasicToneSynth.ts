import {Frequency, OscillatorType, Synth} from 'tone'
import {IDisposable} from '../../common/common-types'
import {emptyMidiNotes, IMidiNote, IMidiNotes} from '../../common/MidiNote'
import {AudioNodeWrapper, IAudioNodeWrapperOptions, IInstrument} from './index'

export class BasicToneSynth extends AudioNodeWrapper implements IDisposable, IInstrument {
	private readonly _synth: Synth = new Synth().toMaster()
	private _previousNotes = emptyMidiNotes
	private _previousNote: IMidiNote | null = null
	private _oscillatorType: OscillatorType = 'sine'
	private _fineTuning: number = 0

	constructor(options: IAudioNodeWrapperOptions) {
		super(options)

		// this._synth.volume
		this._synth.envelope.attack = 0.01
		this._synth.envelope.decay = 0.00
		this._synth.envelope.sustain = 1
		this._synth.envelope.release = 0.01
		this._synth.oscillator.type = 'sine'
	}

	public scheduleNote(note: IMidiNote, delaySeconds: number) {}

	public scheduleRelease(note: number, delaySeconds: number) {}

	public setMidiNotes(midiNotes: IMidiNotes) {
		// const newNotes = midiNotes.filter(x => this._previousNotes.includes(x) === false)
		// const offNotes = this._previousNotes.filter(x => midiNotes.includes(x) === false)

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

	public setOscillatorType = (type: OscillatorType) => {
		if (type === this._oscillatorType) return
		this._oscillatorType = type
		this._synth.oscillator.type = type
	}

	public setFineTuning = (fine: number) => {
		if (fine === this._fineTuning) return
		this._fineTuning = fine
		this._synth.oscillator.detune.value = fine
	}

	public setPan(pan: number) {}

	public setLowPassFilterCutoffFrequency(frequency: number) {}

	public setAttack(attackTimeInSeconds: number) {this._synth.envelope.attack = attackTimeInSeconds}

	public setRelease(releaseTimeInSeconds: number) {this._synth.envelope.release = releaseTimeInSeconds}

	public getActivityLevel = () => 0

	public readonly dispose = () => {
		this._synth.dispose()
	}

	protected getInputAudioNode = () => null
	protected getOutputAudioNode = () => null
}
