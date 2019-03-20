import {List, Map, Stack} from 'immutable'
import {createSelector} from 'reselect'
import {ActionType} from 'typesafe-actions'
import {ConnectionNodeType} from '../common-types'
import {MidiClip, MidiClipEvents} from '../midi-types'
import {emptyMidiNotes, IMidiNote} from '../MidiNote'
import {MAX_MIDI_NOTE_NUMBER_127} from '../server-constants'
import {
	addMultiThing, BROADCASTER_ACTION, CLEAR_SEQUENCER, createSequencerEvents, IClientRoomState,
	IMultiState, IMultiStateThings, isEmptyEvents, makeMultiReducer, NetworkActionType,
	PLAY_ALL, selectAllInfiniteSequencers, selectGlobalClockState, SERVER_ACTION, STOP_ALL,
	UNDO_SEQUENCER,
} from './index'
import {SequencerAction, SequencerStateBase} from './sequencer-redux'

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
		GridSequencerFields.isPlaying,
		GridSequencerFields.scrollY,
		GridSequencerFields.pitch,
	].includes(fieldName)) {
		return {SERVER_ACTION, BROADCASTER_ACTION}
	} else {
		return {}
	}
}

export enum GridSequencerFields {
	gate = 'gate',
	isPlaying = 'isPlaying',
	scrollY = 'scrollY',
	index = 'index',
	pitch = 'pitch',
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
	public static noteWidth = 12
	public static scrollBarWidth = 16
	public static noteHeight = 8
	// public static controlSize = 40

	public static dummy = new GridSequencerState(
		'dummy', 'dummy', 0, List(), false,
	)

	public readonly scrollY: number
	public readonly notesToShow: number

	constructor(
		ownerId: string,
		name: string,
		notesToShow: number,
		events: MidiClipEvents,
		isPlaying = false,
	) {

		const midiClip = new MidiClip({
			events: events.map(x => ({
				...x,
				startBeat: x.startBeat / 4,
				durationBeats: x.durationBeats / 4,
			})),
			length: events.count() / 4,
			loop: true,
		})

		const height = GridSequencerState.noteHeight * notesToShow

		const controlsNum = height < 120 ? 3 : 2

		const controlsWidth = 120

		const notesDisplayWidth = GridSequencerState.noteWidth * midiClip.events.count()

		const width =
			controlsWidth +
			notesDisplayWidth +
			GridSequencerState.scrollBarWidth

		super(
			name,
			midiClip,
			width,
			height,
			ownerId,
			ConnectionNodeType.gridSequencer,
			controlsWidth,
			notesDisplayWidth,
			isPlaying,
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
]

const gridSequencerGlobalActionTypes = [
	PLAY_ALL,
	STOP_ALL,
]

type GridSequencerAction = SequencerAction | ActionType<typeof gridSequencerActions>

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
						createSequencerEvents(gridSequencer.midiClip.events.count(), 1 / 4),
					),
					previousEvents: gridSequencer.previousEvents.unshift(gridSequencer.midiClip.events),
				}
			}
			case PLAY_ALL: return {...gridSequencer, isPlaying: true}
			case STOP_ALL: return {...gridSequencer, isPlaying: false}
			default:
				return gridSequencer
		}
	}

export const gridSequencersReducer =
	makeMultiReducer<GridSequencerState, IGridSequencersState>(
		gridSequencerReducer, ConnectionNodeType.gridSequencer,
		gridSequencerActionTypes, gridSequencerGlobalActionTypes,
	)

export const selectAllGridSequencers = (state: IClientRoomState) => state.shamuGraph.nodes.gridSequencers.things

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

export const selectAllSequencers = createSelector(
	[selectAllGridSequencers, selectAllInfiniteSequencers],
	(gridSeqs, infSeqs) => ({...gridSeqs, ...infSeqs}),
)

export function selectSequencer(state: IClientRoomState, id: string) {
	return selectAllSequencers(state)[id] || GridSequencerState.dummy
}

export const selectIsAnythingPlaying = createSelector(
	[selectAllSequencers],
	allSeqs => Map(allSeqs).some(x => x.isPlaying),
)

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
