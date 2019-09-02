import {List, Stack} from 'immutable'
import {createSelector} from 'reselect'
import {ActionType} from 'typesafe-actions'
import {MAX_MIDI_NOTE_NUMBER_127} from '../common-constants'
import {ConnectionNodeType, IConnectable} from '../common-types'
import {
	assertArrayHasNoUndefinedElements, findLowestNote, findHighestNote,
} from '../common-utils'
import {makeMidiClipEvent, MidiClip, makeEvents} from '../midi-types'
import {emptyMidiNotes, IMidiNote, MidiNotes} from '../MidiNote'
import {
	deserializeSequencerState, selectAllGridSequencers, SequencerAction,
	SequencerStateBase,
	sequencerActionTypes2,
} from './sequencer-redux'
import {
	addMultiThing, BROADCASTER_ACTION, createSequencerEvents, IClientRoomState,
	IMultiState, IMultiStateThings, isEmptyEvents, makeMultiReducer, NetworkActionType,
	selectGlobalClockState, SERVER_ACTION,
} from '.'

export const addGridSequencer = (gridSequencer: GridSequencerState) =>
	addMultiThing(gridSequencer, ConnectionNodeType.gridSequencer, NetworkActionType.SERVER_AND_BROADCASTER)

export const gridSequencerActions = {
	setNote: (gridSequencerId: Id, index: number, enabled: boolean, note: IMidiNote) => ({
		type: 'SET_GRID_SEQUENCER_NOTE',
		id: gridSequencerId,
		index,
		enabled,
		note,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	restart: (id: Id) => ({
		type: 'RESTART_GRID_SEQUENCER',
		id,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	setField: (id: Id, fieldName: GridSequencerFields, data: any) => ({
		type: 'SET_GRID_SEQUENCER_FIELD',
		id,
		fieldName,
		data,
		...getNetworkActionThings(fieldName),
	} as const),
} as const

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

function foo() {
	let i = 0
	return createSequencerEvents(GridSequencerState.eventCount)
		.map(() => (makeMidiClipEvent({
			note: i % 2 === 1 ? -1 : 36,
			startBeat: i++,
			durationBeats: 1,
		})))
		.filter(x => x.note > -1)
}

export class GridSequencerState extends SequencerStateBase {
	public static defaultWidth = 552
	public static defaultHeight = 234
	public static noteNamesSideBarWidth = 16
	public static noteWidth = 8
	public static scrollBarWidth = 16
	public static noteHeight = 8
	public static controlsWidth = 180
	public static eventCount = 32
	public static notesToShow = 24
	public static notesDisplayWidth = GridSequencerState.noteWidth *
		GridSequencerState.eventCount

	public static getWidth = GridSequencerState.controlsWidth +
		GridSequencerState.noteNamesSideBarWidth +
		GridSequencerState.notesDisplayWidth +
		GridSequencerState.scrollBarWidth

	public static getHeight = GridSequencerState.noteHeight *
		GridSequencerState.notesToShow

	public static notesStartX = GridSequencerState.controlsWidth +
		GridSequencerState.noteNamesSideBarWidth

	public static dummy = new GridSequencerState(
		makeEvents(), false,
	)

	public readonly scrollY: number

	public constructor(
		events = foo(),
		isPlaying = false,
	) {
		const midiClip = new MidiClip({
			events,
			length: GridSequencerState.eventCount,
			loop: true,
		})

		super(
			midiClip,
			ConnectionNodeType.gridSequencer,
			isPlaying,
			1,
			1 / 4,
		)

		const lowestNote = findLowestNote(this.midiClip.events)
		const highestNote = findHighestNote(this.midiClip.events)
		const maxScrollY = MAX_MIDI_NOTE_NUMBER_127 - GridSequencerState.notesToShow

		const notesRange = highestNote - lowestNote
		const desiredScrollY = Math.round(lowestNote - (GridSequencerState.notesToShow / 2) + (notesRange / 2))

		this.scrollY = Math.min(maxScrollY, desiredScrollY)
	}
}

export function deserializeGridSequencerState(state: IConnectable): IConnectable {
	const x = state as GridSequencerState
	const z = deserializeSequencerState(x)
	// const notesDisplayWidth = GridSequencerState.noteWidth * z.midiClip.events.count()
	const y: GridSequencerState = {
		...(new GridSequencerState()),
		...z,
		// width: GridSequencerState.getWidth(notesDisplayWidth),
		// height: GridSequencerState.noteHeight * x.notesToShow,
		// notesDisplayStartX: GridSequencerState.controlsWidth + GridSequencerState.noteNamesSideBarWidth,
		// notesDisplayWidth,
	}
	return y
}

type GridSequencerActionTypes = {
	[key in GridSequencerAction['type']]: 0
}

const gridSequencerActionTypes2: GridSequencerActionTypes = {
	...sequencerActionTypes2,
	SET_GRID_SEQUENCER_NOTE: 0,
	SET_GRID_SEQUENCER_FIELD: 0,
	RESTART_GRID_SEQUENCER: 0,
}

const gridSequencerActionTypes = Object.keys(gridSequencerActionTypes2)

assertArrayHasNoUndefinedElements(gridSequencerActionTypes)

const gridSequencerGlobalActionTypes = [
	'PLAY_ALL',
	'STOP_ALL',
]

assertArrayHasNoUndefinedElements(gridSequencerGlobalActionTypes)

export type GridSequencerAction = SequencerAction | ActionType<typeof gridSequencerActions>

const gridSequencerReducer =
	(gridSequencer: GridSequencerState, action: GridSequencerAction): GridSequencerState => {
		switch (action.type) {
			case 'SET_GRID_SEQUENCER_NOTE':
				return {
					...gridSequencer,
					midiClip: gridSequencer.midiClip.update('events', events => {

						const matchedEvent = events.find(x => x.startBeat === action.index && x.note === action.note)

						if (action.enabled) {
							if (matchedEvent) {
								return events
							} else {
								const newEvent = makeMidiClipEvent({
									durationBeats: 1,
									note: action.note,
									startBeat: action.index,
								})
								return events.set(newEvent.id, newEvent)
							}
						} else {
							if (matchedEvent) {
								return events.delete(matchedEvent.id)
							} else {
								return events
							}
						}
					}),
					previousEvents: gridSequencer.previousEvents.unshift(gridSequencer.midiClip.events),
				}
			case 'SET_GRID_SEQUENCER_FIELD':
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
			case 'TOGGLE_SEQUENCER_RECORDING': return {...gridSequencer, isRecording: action.isRecording}
			case 'UNDO_SEQUENCER': {
				if (gridSequencer.previousEvents.count() === 0) return gridSequencer

				const prv = Stack(gridSequencer.previousEvents)

				return {
					...gridSequencer,
					midiClip: gridSequencer.midiClip.set('events', prv.first()),
					previousEvents: prv.shift().toList(),
				}
			}
			case 'CLEAR_SEQUENCER': {
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
			case 'RECORD_SEQUENCER_NOTE':
				const index = action.index
				if (index === undefined) return gridSequencer
				if (!gridSequencer.isRecording) return gridSequencer
				return {
					...gridSequencer,
					midiClip: gridSequencer.midiClip.update('events', events => {
						const newEvent = makeMidiClipEvent({
							note: action.note,
							startBeat: index,
							durationBeats: 1,
						})
						return events.set(newEvent.id, newEvent)
					}),
					previousEvents: gridSequencer.previousEvents.unshift(gridSequencer.midiClip.events),
				}
			case 'PLAY_SEQUENCER': return {...gridSequencer, isPlaying: true}
			case 'STOP_SEQUENCER': return {...gridSequencer, isPlaying: false, isRecording: false}
			case 'PLAY_ALL': return {...gridSequencer, isPlaying: true}
			case 'STOP_ALL': return {...gridSequencer, isPlaying: false, isRecording: false}
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

export const selectGridSequencer = (state: IClientRoomState, id: Id) =>
	selectAllGridSequencers(state)[id as string] || GridSequencerState.dummy

export const selectGridSequencerEvents = (state: IClientRoomState, id: Id) =>
	selectGridSequencer(state, id).midiClip.events

export const selectGridSequencerIsActive = (state: IClientRoomState, id: Id) =>
	selectGridSequencer(state, id).isPlaying

export const selectGridSequencerIsSending = (state: IClientRoomState, id: Id) =>
	false
