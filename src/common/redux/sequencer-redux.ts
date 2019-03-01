import {List} from 'immutable'
import {
	IMultiStateThing, makeMidiClip, makeMidiClipEvent, MidiClip,
	MidiClipEvent, MidiClipEvents,
} from '../common-types'
import {emptyMidiNotes, MidiNotes} from '../MidiNote'
import {BROADCASTER_ACTION, SERVER_ACTION} from './index'

export const CLEAR_SEQUENCER = 'CLEAR_SEQUENCER'
export type ClearSequencerAction = ReturnType<typeof clearSequencer>
export const clearSequencer = (id: string) => ({
	type: CLEAR_SEQUENCER as typeof CLEAR_SEQUENCER,
	id,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const UNDO_SEQUENCER = 'UNDO_SEQUENCER'
export type UndoSequencerAction = ReturnType<typeof undoSequencer>
export const undoSequencer = (id: string) => ({
	type: UNDO_SEQUENCER as typeof UNDO_SEQUENCER,
	id,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const UNDO_RECORDING_SEQUENCER = 'UNDO_RECORDING_SEQUENCER'
export type UndoRecordingSequencerAction = ReturnType<typeof undoRecordingSequencer>
export const undoRecordingSequencer = () => ({
	type: UNDO_RECORDING_SEQUENCER as typeof UNDO_RECORDING_SEQUENCER,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const SKIP_NOTE = 'SKIP_NOTE'
export type SkipNoteAction = ReturnType<typeof skipNote>
export const skipNote = () => ({
	type: SKIP_NOTE as typeof SKIP_NOTE,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const createSequencerEvents = (length: number): MidiClipEvents => {
	return makeSequencerEvents(
		new Array(length)
			.fill(0)
			.map((_, i) => makeMidiClipEvent({notes: emptyMidiNotes, startBeat: i})),
	)
}

export const makeSequencerEvents =
	(x: MidiClipEvent[] | List<MidiClipEvent> = Array<MidiClipEvent>()): MidiClipEvents => List<MidiClipEvent>(x)

export function deserializeEvents(events: MidiClipEvents): MidiClipEvents {
	return makeSequencerEvents(events.map(x => ({...x, notes: MidiNotes(x.notes)})))
}

export interface ISequencerState extends IMultiStateThing {
	midiClip: MidiClip
	index: number
	isPlaying: boolean
	id: string
	color: string
	name: string
	isRecording: boolean
	previousEvents: List<MidiClipEvents>
	width: number
	height: number
	rate: number
}

export function isEmptyEvents(events: MidiClipEvents) {
	return events.some(x => x.notes.count() > 0) === false
}

export function deserializeSequencerState<T extends ISequencerState>(state: IMultiStateThing): IMultiStateThing {
	const x = state as T
	const y = {
		...x,
		midiClip: makeMidiClip({
			length: x.midiClip.length,
			loop: x.midiClip.loop,
			events: deserializeEvents(x.midiClip.events),
		}),
		previousEvents: List(x.previousEvents.map(deserializeEvents)),
	} as T
	return y
}
