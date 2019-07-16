import {Set} from 'immutable'

export type IMidiNote = number
export type IMidiNotes = Set<IMidiNote>
// eslint-disable-next-line no-array-constructor
export const MidiNotes = (midiNotesArray: Set<IMidiNote> | IMidiNote[] = Array<IMidiNote>()) => Set<IMidiNote>(midiNotesArray)
export const emptyMidiNotes = MidiNotes()
