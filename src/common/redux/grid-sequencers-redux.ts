import {Map, Stack} from 'immutable'
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
import {selectGlobalClockState} from './global-clock-redux'
import {selectAllInfiniteSequencers} from './infinite-sequencers-redux'
import {
	addMultiThing, deleteThings, IMultiState,
	IMultiStateThings, makeMultiReducer, MultiThingType, updateThings,
} from './multi-reducer'
import {BROADCASTER_ACTION, NetworkActionType, SERVER_ACTION} from './redux-utils'
import {
	CLEAR_SEQUENCER, createSequencerEvents, isEmptyEvents, ISequencerEvent, ISequencerState, UNDO_SEQUENCER,
} from './sequencer-redux'

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

export interface IGridSequencersState extends IMultiState {
	things: IGridSequencers
}

export interface IGridSequencers extends IMultiStateThings {
	[key: string]: IGridSequencerState
}

export interface IGridSequencerState extends ISequencerState {
	scrollY: number
	notesToShow: number
}

export class GridSequencerState implements IGridSequencerState {
	public static defaultWidth = 520
	public static defaultHeight = 234
	public static noteWidth = 12
	public static scrollBarWidth = 16
	public static noteHeight = 8
	public static controlSize = 40

	public static dummy: IGridSequencerState = {
		id: 'dummy',
		events: [],
		index: -1,
		isPlaying: false,
		color: 'gray',
		name: 'dummy',
		scrollY: 0,
		notesToShow: 0,
		isRecording: false,
		previousEvents: [],
		width: GridSequencerState.defaultWidth,
		height: GridSequencerState.defaultHeight,
	}

	public readonly id: string = uuid.v4()
	public readonly events: ISequencerEvent[]
	public readonly index: number = -1
	public readonly isPlaying: boolean = false
	public readonly color: string
	public readonly name: string
	public readonly scrollY: number
	public readonly notesToShow: number
	public readonly isRecording: boolean = false
	public readonly previousEvents: ISequencerEvent[][] = []
	public readonly width: number = GridSequencerState.defaultWidth
	public readonly height: number = GridSequencerState.defaultHeight

	constructor(name: string, notesToShow: number, events?: ISequencerEvent[]) {
		this.name = name
		this.color = colorFunc(hashbow(this.id)).desaturate(0.2).hsl().string()
		this.events = events || createSequencerEvents(8)
		this.notesToShow = notesToShow

		this.scrollY = this._calculateScrollY()

		this.height = GridSequencerState.noteHeight * notesToShow

		const controlsNum = this.height < 120 ? 3 : 2

		const controlsWidth = GridSequencerState.controlSize * controlsNum

		this.width =
			controlsWidth +
			(GridSequencerState.noteWidth * this.events.length) +
			GridSequencerState.scrollBarWidth
	}

	private get maxScrollY() {return MAX_MIDI_NOTE_NUMBER_127 - this.notesToShow}
	private get lowestNote() {return findLowestNote(this.events)}
	private get highestNote() {return findHighestNote(this.events)}

	private _calculateScrollY() {
		const notesRange = this.highestNote - this.lowestNote
		const desiredScrollY = Math.round(this.lowestNote - (this.notesToShow / 2) + (notesRange / 2))

		return Math.min(this.maxScrollY, desiredScrollY)
	}
}

export function findLowestAndHighestNotes(events: ISequencerEvent[]) {
	return {
		lowestNote: findLowestNote(events),
		highestNote: findHighestNote(events),
	}
}

export function findLowestNote(events: ISequencerEvent[]): number {
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

export function findHighestNote(events: ISequencerEvent[]): number {
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
					previousEvents: [gridSequencer.events, ...gridSequencer.previousEvents],
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
			case UNDO_SEQUENCER: {
				if (gridSequencer.previousEvents.length === 0) return gridSequencer

				const prv = Stack(gridSequencer.previousEvents)

				return {
					...gridSequencer,
					events: prv.first(),
					previousEvents: prv.shift().toJS(),
				}
			}
			case CLEAR_SEQUENCER: {
				if (isEmptyEvents(gridSequencer.events)) return gridSequencer

				return {
					...gridSequencer,
					events: createSequencerEvents(gridSequencer.events.length),
					previousEvents: [gridSequencer.events, ...gridSequencer.previousEvents],
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

export const selectGridSequencer = (state: IClientRoomState, id: string) =>
	selectAllGridSequencers(state)[id] || GridSequencerState.dummy

export const selectGridSequencerIsActive = (state: IClientRoomState, id: string) =>
	selectGridSequencer(state, id).isPlaying

export const selectGridSequencerIsSending = (state: IClientRoomState, id: string) =>
	selectGridSequencerActiveNotes(state, id).length > 0

export const selectAllSequencers = createSelector(
	[selectAllGridSequencers, selectAllInfiniteSequencers],
	(gridSeqs, infSeqs) => ({...gridSeqs, ...infSeqs}),
)

export const selectIsAnythingPlaying = createSelector(
	[selectAllSequencers],
	allSeqs => Map(allSeqs).some(x => x.isPlaying),
)

const emptyArray: number[] = []

export const selectGridSequencerActiveNotes = createSelector(
	[selectGridSequencer, selectGlobalClockState],
	(gridSequencer, globalClockState) => {
		if (!gridSequencer) return emptyArray
		if (!gridSequencer.isPlaying) return emptyArray

		const globalClockIndex = globalClockState.index

		const index = globalClockIndex

		if (index >= 0 && gridSequencer.events.length > 0) {
			return gridSequencer.events[index % gridSequencer.events.length].notes
		} else {
			return emptyArray
		}
	},
)
