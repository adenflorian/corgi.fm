import {IMidiNotes} from '../../common/MidiNote'

export interface IInstrument {
	setMidiNotes: (midiNotes: IMidiNotes) => void
	dispose: () => void
}

export interface IInstrumentOptions {
	audioContext: AudioContext
	destination: AudioNode
}
