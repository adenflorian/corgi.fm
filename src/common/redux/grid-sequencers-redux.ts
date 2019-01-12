import {AnyAction, Reducer} from 'redux'
import {createSelector} from 'reselect'
import * as uuid from 'uuid'
import {hashbow} from '../../client/utils'
import {IMidiNote} from '../MidiNote'
import {addIfNew} from '../server-common'
import {MAX_MIDI_NOTE_NUMBER_127} from '../server-constants'
import {colorFunc} from '../shamu-color'
import {PLAY_ALL, STOP_ALL} from './common-actions'
import {IClientRoomState} from './common-redux-types'
import {
	addMultiThing, deleteThings, IMultiState,
	IMultiStateThing, IMultiStateThings, makeMultiReducer, MultiThingType, updateThings,
} from './multi-reducer'
import {BROADCASTER_ACTION, NetworkActionType, SERVER_ACTION} from './redux-utils'

export const ADD_GRID_SEQUENCER = 'ADD_GRID_SEQUENCER'
export const addGridSequencer = (gridSequencer: IGridSequencerState) =>
	addMultiThing(gridSequencer, MultiThingType.gridSequencer, NetworkActionType.SERVER_AND_BROADCASTER)

export const DELETE_GRID_SEQUENCERS = 'DELETE_GRID_SEQUENCERS'
export const deleteGridSequencers = (gridSequencerIds: string[]) =>
	deleteThings(gridSequencerIds, MultiThingType.gridSequencer, NetworkActionType.SERVER_AND_BROADCASTER)

export const UPDATE_GRID_SEQUENCERS = 'UPDATE_GRID_SEQUENCERS'
export const updateGridSequencers = (gridSequencers: IGridSequencers) =>
	updateThings(gridSequencers, MultiThingType.gridSequencer, NetworkActionType.BROADCASTER)

export const SET_GRID_SEQUENCER_NOTE = 'SET_GRID_SEQUENCER_NOTE'
export const setGridSequencerNote =
	(gridSequencerId: string, index: number, enabled: boolean, note: IMidiNote) => {
		return {
			type: SET_GRID_SEQUENCER_NOTE,
			id: gridSequencerId,
			index,
			enabled,
			note,
			SERVER_ACTION,
			BROADCASTER_ACTION,
		}
	}

export const RESTART_GRID_SEQUENCER = 'RESTART_GRID_SEQUENCER'
export const restartGridSequencer = (id: string) => ({
	type: RESTART_GRID_SEQUENCER,
	id,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const EXPORT_SEQUENCER_MIDI = 'EXPORT_SEQUENCER_MIDI'
export type ExportSequencerMidiAction = ReturnType<typeof exportSequencerMidi>
export const exportSequencerMidi = (sequencerId: string) => ({
	type: EXPORT_SEQUENCER_MIDI,
	sequencerId,
})

export const SET_GRID_SEQUENCER_FIELD = 'SET_GRID_SEQUENCER_FIELD'
export type SetGridSequencerField = ReturnType<typeof setGridSequencerField>
export const setGridSequencerField = (id: string, fieldName: GridSequencerFields, data: any) => ({
	type: SET_GRID_SEQUENCER_FIELD,
	id,
	fieldName,
	data,
	...foo(fieldName),
})

function foo(fieldName: GridSequencerFields) {
	if ([
		GridSequencerFields.isPlaying,
		GridSequencerFields.scrollY,
	].includes(fieldName)) {
		return {SERVER_ACTION, BROADCASTER_ACTION}
	} else {
		return {}
	}
}

export enum GridSequencerFields {
	isPlaying = 'isPlaying',
	scrollY = 'scrollY',
	index = 'index',
}

export interface IGridSequencerEvent {
	notes: IMidiNote[]
}

export interface IGridSequencersState extends IMultiState {
	things: IGridSequencers
}

export interface IGridSequencers extends IMultiStateThings {
	[key: string]: IGridSequencerState
}

export interface ISequencerState extends IMultiStateThing {
	events: IGridSequencerEvent[]
	index: number
	isPlaying: boolean
	id: string
	color: string
	name: string
}

export interface IGridSequencerState extends ISequencerState {
	scrollY: number
	notesToShow: number
}

export class GridSequencerState implements IGridSequencerState {
	private static readonly _defaultEvents =
		[{notes: []}, {notes: []}, {notes: []}, {notes: []}, {notes: []}, {notes: []}, {notes: []}, {notes: []}]

	public readonly id: string = uuid.v4()
	public readonly events: IGridSequencerEvent[]
	public readonly index: number = -1
	public readonly isPlaying: boolean = false
	public readonly color: string
	public readonly name: string
	public readonly scrollY: number
	public readonly notesToShow: number

	constructor(name: string, notesToShow: number, events?: IGridSequencerEvent[]) {
		this.name = name
		this.color = colorFunc(hashbow(this.id)).desaturate(0.2).hsl().string()
		this.events = events || GridSequencerState._defaultEvents
		this.notesToShow = notesToShow

		this.scrollY = this._calculateScrollY()
	}

	get maxScrollY() {return MAX_MIDI_NOTE_NUMBER_127 - this.notesToShow}
	get lowestNote() {return findLowestNote(this.events)}
	get highestNote() {return findHighestNote(this.events)}

	private _calculateScrollY() {
		const notesRange = this.highestNote - this.lowestNote
		const desiredScrollY = Math.round(this.lowestNote - (this.notesToShow / 2) + (notesRange / 2))

		return Math.min(this.maxScrollY, desiredScrollY)
	}
}

export function findLowestAndHighestNotes(events: IGridSequencerEvent[]) {
	return {
		lowestNote: findLowestNote(events),
		highestNote: findHighestNote(events),
	}
}

export function findLowestNote(events: IGridSequencerEvent[]): number {
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

export function findHighestNote(events: IGridSequencerEvent[]): number {
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

export interface IGridSequencerEvent {
	notes: IMidiNote[]
}

const gridSequencerActionTypes = [
	SET_GRID_SEQUENCER_NOTE,
	SET_GRID_SEQUENCER_FIELD,
]

const gridSequencerGlobalActionTypes = [
	PLAY_ALL,
	STOP_ALL,
]

const gridSequencerReducer: Reducer<IGridSequencerState, AnyAction> =
	(gridSequencer = new GridSequencerState('defaultName', 4), action) => {
		switch (action.type) {
			case SET_GRID_SEQUENCER_NOTE:
				if (action.note === undefined) {
					throw new Error('action.notes === undefined')
				}
				return {
					...gridSequencer,
					events: gridSequencer.events.map((event, eventIndex) => {
						if (eventIndex === action.index) {
							if (action.enabled) {
								return {
									...event,
									notes: addIfNew(event.notes, action.note),
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
					}),
				}
			case SET_GRID_SEQUENCER_FIELD:
				if (action.fieldName === 'index') {
					return {
						...gridSequencer,
						[action.fieldName]: action.data % gridSequencer.events.length,
					}
				} else {
					return {
						...gridSequencer,
						[action.fieldName]: action.data,
					}
				}
			case PLAY_ALL: return {...gridSequencer, isPlaying: true}
			case STOP_ALL: return {...gridSequencer, isPlaying: false}
			default:
				return gridSequencer
		}
	}

export const gridSequencersReducer =
	makeMultiReducer<IGridSequencerState, IGridSequencersState>(
		gridSequencerReducer, MultiThingType.gridSequencer,
		gridSequencerActionTypes, gridSequencerGlobalActionTypes,
	)

export const selectAllGridSequencers = (state: IClientRoomState) => state.gridSequencers.things

export const selectAllGridSequencerIds = createSelector(
	selectAllGridSequencers,
	gridSequencers => Object.keys(gridSequencers),
)

export const selectAllSequencers = (state: IClientRoomState) => ({
	...state.gridSequencers.things,
	...state.infiniteSequencers.things,
})
