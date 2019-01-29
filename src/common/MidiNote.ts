import {Set} from 'immutable'

export type IMidiNote = number
export type IMidiNotes = Set<IMidiNote>
export const MidiNotes = (midiNotesArray: Set<IMidiNote> | IMidiNote[] = Array<IMidiNote>()) => Set<IMidiNote>(midiNotesArray)
export const emptyMidiNotes = MidiNotes()
