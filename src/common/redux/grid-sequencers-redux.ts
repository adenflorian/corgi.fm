import {List, Stack} from 'immutable'
import {createSelector} from 'reselect'
import {ActionType} from 'typesafe-actions'
import {ConnectionNodeType, IMultiStateThing} from '../common-types'
import {assertArrayHasNoUndefinedElements} from '../common-utils'
import {makeMidiClipEvent, MidiClip, MidiClipEvents} from '../midi-types'
import {emptyMidiNotes, IMidiNote, MidiNotes} from '../MidiNote'
import {MAX_MIDI_NOTE_NUMBER_127} from '../server-constants'
import {
	addMultiThing, BROADCASTER_ACTION, CLEAR_SEQUENCER, createSequencerEvents, IClientRoomState,
	IMultiState, IMultiStateThings, isEmptyEvents, makeMultiReducer, NetworkActionType,
	PLAY_ALL, selectGlobalClockState, SERVER_ACTION, STOP_ALL,
	UNDO_SEQUENCER,
} from './index'
import {deserializeSequencerState, ISequencerState, PLAY_SEQUENCER, RECORD_SEQUENCER_NOTE, selectAllGridSequencers, SequencerAction, SequencerStateBase, STOP_SEQUENCER, TOGGLE_SEQUENCER_RECORDING} from './sequencer-redux'

export const addGridSequencer = (gridSequencer: GridSequencerState) =>
	addMultiThing(gridSequencer, ConnectionNodeType.gridSequencer, NetworkActionType.SERVER_AND_BROADCASTER)

export const SET_GRID_SEQUENCER_NOTE = 'SET_GRID_SEQUENCER_NOTE'
export const RESTART_GRID_SEQUENCER = 'RESTART_GRID_SEQUENCER'
export const SET_GRID_SEQUENCER_FIELD = 'SET_GRID_SEQUENCER_FIELD'

export const gridSequencerActions = Object.freeze({
	setNote: (gridSequencerId: string, index: number, enabled: boolean, note: IMidiNote) => ({
		type: SET_GRID_SEQUENCER_NOTE as typeof SET_GRID_SEQUENCER_NOTE,
		id: gridSequencerId,
		index,
		enabled,
		note,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	restart: (id: string) => ({
		type: RESTART_GRID_SEQUENCER as typeof RESTART_GRID_SEQUENCER,
		id,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	setField: (id: string, fieldName: GridSequencerFields, data: any) => ({
		type: SET_GRID_SEQUENCER_FIELD as typeof SET_GRID_SEQUENCER_FIELD,
		id,
		fieldName,
		data,
		...getNetworkActionThings(fieldName),
	}),
})

function getNetworkActionThings(fieldName: GridSequencerFields) {
	if ([
		GridSequencerFields.gate,
		GridSequencerFields.scrollY,
		GridSequencerFields.pitch,
		GridSequencerFields.rate,
	].includes(fieldName)) {
		return {SERVER_ACTION, BROADCASTER_ACTION}
	} else {
		return {}
	}
}

export enum GridSequencerFields {
	gate = 'gate',
	scrollY = 'scrollY',
	index = 'index',
	pitch = 'pitch',
	rate = 'rate',
}

export interface IGridSequencersState extends IMultiState {
	things: IGridSequencers
}

export interface IGridSequencers extends IMultiStateThings {
	[key: string]: GridSequencerState
}

export class GridSequencerState extends SequencerStateBase {
	// public static defaultWidth = 552
	// public static defaultHeight = 234
	public static noteNamesSideBarWidth = 16
	public static noteWidth = 8
	public static scrollBarWidth = 16
	public static noteHeight = 8
	public static controlsWidth = 180
	public static getWidth = (notesDisplayWidth: number) => GridSequencerState.controlsWidth +
		GridSequencerState.noteNamesSideBarWidth +
		notesDisplayWidth +
		GridSequencerState.scrollBarWidth

	public static dummy = new GridSequencerState(
		'dummy', 'dummy', 0, List(), false,
	)

	public readonly scrollY: number
	public readonly notesToShow: number

	constructor(
		ownerId: string,
		name = 'Grid Sequencer',
		notesToShow = 24,
		events = createSequencerEvents(32)
			.map((_, i) => (makeMidiClipEvent({
				notes: MidiNotes(i % 2 === 1 ? [] : [36]),
				startBeat: i,
				durationBeats: 1,
			}))),
		isPlaying = false,
	) {

		const midiClip = new MidiClip({
			events: events.map(x => ({
				...x,
				startBeat: x.startBeat,
				durationBeats: x.durationBeats,
			})),
			length: events.count(),
			loop: true,
		})

		const height = GridSequencerState.noteHeight * notesToShow

		const notesDisplayWidth = GridSequencerState.noteWidth * midiClip.events.count()

		const width = GridSequencerState.getWidth(notesDisplayWidth)

		super(
			name,
			midiClip,
			width,
			height,
			ownerId,
			ConnectionNodeType.gridSequencer,
			GridSequencerState.controlsWidth + GridSequencerState.noteNamesSideBarWidth,
			notesDisplayWidth,
			isPlaying,
			1,
			1 / 4,
		)

		this.notesToShow = notesToShow

		const lowestNote = findLowestNote(this.midiClip.events)
		const highestNote = findHighestNote(this.midiClip.events)
		const maxScrollY = MAX_MIDI_NOTE_NUMBER_127 - this.notesToShow

		const notesRange = highestNote - lowestNote
		const desiredScrollY = Math.round(lowestNote - (this.notesToShow / 2) + (notesRange / 2))

		this.scrollY = Math.min(maxScrollY, desiredScrollY)
	}
}

export function deserializeGridSequencerState(state: IMultiStateThing): IMultiStateThing {
	const x = state as GridSequencerState
	const z = deserializeSequencerState(x) as ISequencerState
	const notesDisplayWidth = GridSequencerState.noteWidth * z.midiClip.events.count()
	const y = {
		...(new GridSequencerState(x.ownerId)),
		...z,
		width: Math.max(x.width, GridSequencerState.getWidth(notesDisplayWidth)),
		height: Math.max(x.height, GridSequencerState.noteHeight * x.notesToShow),
		notesDisplayStartX: GridSequencerState.controlsWidth + GridSequencerState.noteNamesSideBarWidth,
		notesDisplayWidth,
	} as GridSequencerState
	return y
}

export function findLowestAndHighestNotes(events: MidiClipEvents) {
	return {
		lowestNote: findLowestNote(events),
		highestNote: findHighestNote(events),
	}
}

export function findLowestNote(events: MidiClipEvents): number {
	let lowest = Number.MAX_VALUE

	events.forEach(event => {
		event.notes.forEach(note => {
			if (note < lowest) {
				lowest = note
			}
		})
	})

	if (lowest === Number.MAX_VALUE) {
		return 0
	}

	return lowest
}

export function findHighestNote(events: MidiClipEvents): number {
	let highest = Number.MIN_VALUE

	events.forEach(event => {
		event.notes.forEach(note => {
			if (note > highest) {
				highest = note
			}
		})
	})

	if (highest === Number.MIN_VALUE) {
		return 127
	}

	return highest
}

const gridSequencerActionTypes = [
	SET_GRID_SEQUENCER_NOTE,
	SET_GRID_SEQUENCER_FIELD,
	CLEAR_SEQUENCER,
	UNDO_SEQUENCER,
	PLAY_SEQUENCER,
	STOP_SEQUENCER,
	TOGGLE_SEQUENCER_RECORDING,
	RECORD_SEQUENCER_NOTE,
]

assertArrayHasNoUndefinedElements(gridSequencerActionTypes)

const gridSequencerGlobalActionTypes = [
	PLAY_ALL,
	STOP_ALL,
]

assertArrayHasNoUndefinedElements(gridSequencerGlobalActionTypes)

export type GridSequencerAction = SequencerAction | ActionType<typeof gridSequencerActions>

const gridSequencerReducer =
	(gridSequencer: GridSequencerState, action: GridSequencerAction): GridSequencerState => {
		switch (action.type) {
			case SET_GRID_SEQUENCER_NOTE:
				if (action.note === undefined) {
					throw new Error('action.notes === undefined')
				}
				return {
					...gridSequencer,
					midiClip: gridSequencer.midiClip.set('events', gridSequencer.midiClip.events.map((event, eventIndex) => {
						if (eventIndex === action.index) {
							if (action.enabled) {
								return {
									...event,
									notes: event.notes.add(action.note),
								}
							} else {
								return {
									...event,
									notes: event.notes.filter(x => x !== action.note),
								}
							}
						} else {
							return event
						}
					})),
					previousEvents: gridSequencer.previousEvents.unshift(gridSequencer.midiClip.events),
				}
			case SET_GRID_SEQUENCER_FIELD:
				if (action.fieldName === 'index') {
					return {
						...gridSequencer,
						[action.fieldName]: action.data % gridSequencer.midiClip.events.count(),
					}
				} else {
					return {
						...gridSequencer,
						[action.fieldName]: action.data,
					}
				}
			case TOGGLE_SEQUENCER_RECORDING: return {...gridSequencer, isRecording: action.isRecording}
			case UNDO_SEQUENCER: {
				if (gridSequencer.previousEvents.count() === 0) return gridSequencer

				const prv = Stack(gridSequencer.previousEvents)

				return {
					...gridSequencer,
					midiClip: gridSequencer.midiClip.set('events', prv.first()),
					previousEvents: prv.shift().toList(),
				}
			}
			case CLEAR_SEQUENCER: {
				if (isEmptyEvents(gridSequencer.midiClip.events)) return gridSequencer

				return {
					...gridSequencer,
					midiClip: gridSequencer.midiClip.set(
						'events',
						createSequencerEvents(gridSequencer.midiClip.events.count(), 1),
					),
					previousEvents: gridSequencer.previousEvents.unshift(gridSequencer.midiClip.events),
				}
			}
			case RECORD_SEQUENCER_NOTE:
				const index = action.index
				if (index === undefined) return gridSequencer
				if (gridSequencer.isRecording) {
					return {
						...gridSequencer,
						midiClip: gridSequencer.midiClip.withMutations(mutable => {
							mutable.set('events',
								mutable.events.update(
									index,
									x => ({...x, notes: x.notes.add(action.note)})))
						}),
						previousEvents: gridSequencer.previousEvents.unshift(gridSequencer.midiClip.events),
					}
				} else {
					return gridSequencer
				}
			case PLAY_SEQUENCER: return {...gridSequencer, isPlaying: true, isRecording: false}
			case STOP_SEQUENCER: return {...gridSequencer, isPlaying: false, isRecording: false}
			case PLAY_ALL: return {...gridSequencer, isPlaying: true}
			case STOP_ALL: return {...gridSequencer, isPlaying: false, isRecording: false}
			default:
				return gridSequencer
		}
	}

export const gridSequencersReducer =
	makeMultiReducer<GridSequencerState, IGridSequencersState>(
		gridSequencerReducer, ConnectionNodeType.gridSequencer,
		gridSequencerActionTypes, gridSequencerGlobalActionTypes,
	)

export const selectAllGridSequencerIds = createSelector(
	selectAllGridSequencers,
	gridSequencers => Object.keys(gridSequencers),
)

export const selectGridSequencer = (state: IClientRoomState, id: string) =>
	selectAllGridSequencers(state)[id] || GridSequencerState.dummy

export const selectGridSequencerEvents = (state: IClientRoomState, id: string) =>
	selectGridSequencer(state, id).midiClip.events

export const selectGridSequencerIsActive = (state: IClientRoomState, id: string) =>
	selectGridSequencer(state, id).isPlaying

export const selectGridSequencerIsSending = (state: IClientRoomState, id: string) =>
	selectGridSequencerActiveNotes(state, id).count() > 0

export const selectGridSequencerActiveNotes = createSelector(
	[selectGridSequencer, selectGlobalClockState],
	(gridSequencer, globalClockState) => {
		if (!gridSequencer) return emptyMidiNotes
		if (!gridSequencer.isPlaying) return emptyMidiNotes

		const globalClockIndex = globalClockState.index

		const index = globalClockIndex

		if (index >= 0 && gridSequencer.midiClip.events.count() > 0) {
			return gridSequencer.midiClip.events.get(index % gridSequencer.midiClip.events.count())!.notes
		} else {
			return emptyMidiNotes
		}
	},
)
