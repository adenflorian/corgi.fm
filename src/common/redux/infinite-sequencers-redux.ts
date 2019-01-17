import {Stack} from 'immutable'
import {AnyAction} from 'redux'
import {createSelector} from 'reselect'
import * as uuid from 'uuid'
import {hashbow} from '../../client/utils'
import {IMidiNote} from '../MidiNote'
import {addIfNew} from '../server-common'
import {colorFunc} from '../shamu-color'
import {PLAY_ALL, STOP_ALL} from './common-actions'
import {IClientRoomState} from './common-redux-types'
import {IConnectable} from './connections-redux'
import {selectGlobalClockState} from './global-clock-redux'
import {
	addMultiThing, deleteThings, IMultiState,
	IMultiStateThings, makeMultiReducer, MultiThingType, updateThings,
} from './multi-reducer'
import {BROADCASTER_ACTION, NetworkActionType, SERVER_ACTION} from './redux-utils'
import {
	CLEAR_SEQUENCER, createSequencerEvents, ISequencerEvent, ISequencerState, SKIP_NOTE, UNDO_SEQUENCER,
} from './sequencer-redux'
import {VIRTUAL_KEY_PRESSED} from './virtual-keyboard-redux'

export const ADD_INFINITE_SEQUENCER = 'ADD_INFINITE_SEQUENCER'
export const addInfiniteSequencer = (infiniteSequencer: InfiniteSequencerState) =>
	addMultiThing(infiniteSequencer, MultiThingType.infiniteSequencer, NetworkActionType.SERVER_AND_BROADCASTER)

export const DELETE_INFINITE_SEQUENCERS = 'DELETE_INFINITE_SEQUENCERS'
export const deleteInfiniteSequencers = (infiniteSequencerIds: string[]) =>
	deleteThings(infiniteSequencerIds, MultiThingType.infiniteSequencer, NetworkActionType.SERVER_AND_BROADCASTER)

export const UPDATE_INFINITE_SEQUENCERS = 'UPDATE_INFINITE_SEQUENCERS'
export const updateInfiniteSequencers = (infiniteSequencers: IInfiniteSequencers) =>
	updateThings(infiniteSequencers, MultiThingType.infiniteSequencer, NetworkActionType.BROADCASTER)

export const SET_INFINITE_SEQUENCER_NOTE = 'SET_INFINITE_SEQUENCER_NOTE'
export const setInfiniteSequencerNote =
	(infiniteSequencerId: string, index: number, enabled: boolean, note: IMidiNote) => {
		return {
			type: SET_INFINITE_SEQUENCER_NOTE,
			id: infiniteSequencerId,
			index,
			enabled,
			note,
			SERVER_ACTION,
			BROADCASTER_ACTION,
		}
	}

export const RESTART_INFINITE_SEQUENCER = 'RESTART_INFINITE_SEQUENCER'
export const restartInfiniteSequencer = (id: string) => ({
	type: RESTART_INFINITE_SEQUENCER,
	id,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const SET_INFINITE_SEQUENCER_FIELD = 'SET_INFINITE_SEQUENCER_FIELD'
export type SetInfiniteSequencerField = ReturnType<typeof setInfiniteSequencerField>
export const setInfiniteSequencerField =
	(id: string, fieldName: InfiniteSequencerFields, data: any) => ({
		type: SET_INFINITE_SEQUENCER_FIELD,
		id,
		fieldName,
		data,
		...foo(fieldName),
	})

function foo(fieldName: InfiniteSequencerFields) {
	if ([
		InfiniteSequencerFields.isPlaying,
		InfiniteSequencerFields.bottomNote,
		InfiniteSequencerFields.isRecording,
		InfiniteSequencerFields.style,
		InfiniteSequencerFields.showRows,
	].includes(fieldName)) {
		return {SERVER_ACTION, BROADCASTER_ACTION}
	} else {
		return {}
	}
}

export enum InfiniteSequencerFields {
	isPlaying = 'isPlaying',
	bottomNote = 'bottomNote',
	index = 'index',
	isRecording = 'isRecording',
	style = 'style',
	showRows = 'showRows',
}

export interface IInfiniteSequencersState extends IMultiState {
	things: IInfiniteSequencers
}

export interface IInfiniteSequencers extends IMultiStateThings {
	[key: string]: InfiniteSequencerState
}

export enum InfiniteSequencerStyle {
	colorBars = 'colorBars',
	colorGrid = 'colorGrid',
}

export class InfiniteSequencerState implements ISequencerState, IConnectable {
	public readonly id: string = uuid.v4()
	public readonly events: ISequencerEvent[]
	public readonly index: number = -1
	public readonly isPlaying: boolean = false
	public readonly color: string
	public readonly name: string
	public readonly isRecording: boolean = false
	public readonly style: InfiniteSequencerStyle
	public readonly previousEvents: ISequencerEvent[][] = []
	public readonly showRows = false

	constructor(name: string, style: InfiniteSequencerStyle, events?: ISequencerEvent[]) {
		this.name = name
		this.color = colorFunc(hashbow(this.id)).desaturate(0.2).hsl().string()
		this.events = events ||
			[{notes: [44]}, {notes: [45]}, {notes: [46]}, {notes: [47]},
			{notes: [48]}, {notes: [49]}, {notes: [50]}, {notes: [51]}]
		this.style = style
	}
}

const infiniteSequencerActionTypes = [
	SET_INFINITE_SEQUENCER_NOTE,
	SET_INFINITE_SEQUENCER_FIELD,
	CLEAR_SEQUENCER,
	UNDO_SEQUENCER,
]

const infiniteSequencerGlobalActionTypes = [
	PLAY_ALL,
	STOP_ALL,
	VIRTUAL_KEY_PRESSED,
	SKIP_NOTE,
]

export const infiniteSequencersReducer =
	makeMultiReducer<InfiniteSequencerState, IInfiniteSequencersState>(
		infiniteSequencerReducer, MultiThingType.infiniteSequencer,
		infiniteSequencerActionTypes, infiniteSequencerGlobalActionTypes,
	)

function infiniteSequencerReducer(
	infiniteSequencer: InfiniteSequencerState, action: AnyAction,
): InfiniteSequencerState {
	switch (action.type) {
		case SET_INFINITE_SEQUENCER_NOTE: {
			return {
				...infiniteSequencer,
				events: infiniteSequencer.events.map((event, eventIndex) => {
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
				previousEvents: [infiniteSequencer.events, ...infiniteSequencer.previousEvents],
			}
		}
		case SET_INFINITE_SEQUENCER_FIELD:
			if (action.fieldName === InfiniteSequencerFields.isRecording && action.data === true) {
				return {
					...infiniteSequencer,
					[action.fieldName]: action.data,
				}
			} else if (action.fieldName === InfiniteSequencerFields.index) {
				return {
					...infiniteSequencer,
					[action.fieldName]: action.data % infiniteSequencer.events.length,
				}
			} else if (action.fieldName === InfiniteSequencerFields.isPlaying && action.data === false) {
				return {
					...infiniteSequencer,
					[action.fieldName]: action.data,
					isRecording: false,
				}
			} else {
				return {
					...infiniteSequencer,
					[action.fieldName]: action.data,
				}
			}
		case UNDO_SEQUENCER: {
			if (infiniteSequencer.previousEvents.length === 0) return infiniteSequencer

			const prv = Stack(infiniteSequencer.previousEvents)

			return {
				...infiniteSequencer,
				events: prv.first(),
				previousEvents: prv.shift().toJS(),
			}
		}
		case CLEAR_SEQUENCER: {
			if (infiniteSequencer.events.length === 0) return infiniteSequencer

			return {
				...infiniteSequencer,
				events: createSequencerEvents(0),
				previousEvents: [infiniteSequencer.events, ...infiniteSequencer.previousEvents],
			}
		}
		case PLAY_ALL: return {...infiniteSequencer, isPlaying: true}
		case STOP_ALL: return {...infiniteSequencer, isPlaying: false, isRecording: false}
		case VIRTUAL_KEY_PRESSED:
			if (infiniteSequencer.isRecording) {
				return {
					...infiniteSequencer,
					events: infiniteSequencer.events.concat({notes: [action.midiNote]}),
					previousEvents: [infiniteSequencer.events, ...infiniteSequencer.previousEvents],
				}
			} else {
				return infiniteSequencer
			}
		case SKIP_NOTE:
			if (infiniteSequencer.isRecording) {
				return {
					...infiniteSequencer,
					events: infiniteSequencer.events.concat({notes: []}),
					previousEvents: [infiniteSequencer.events, ...infiniteSequencer.previousEvents],
				}
			} else {
				return infiniteSequencer
			}
		default:
			return infiniteSequencer
	}
}

export const selectAllInfiniteSequencers = (state: IClientRoomState) => state.infiniteSequencers.things

export const selectInfiniteSequencer = (state: IClientRoomState, id: string) => selectAllInfiniteSequencers(state)[id]

const emptyArray: number[] = []

export const selectInfiniteSequencerActiveNotes = createSelector(
	[selectInfiniteSequencer, selectGlobalClockState],
	(infiniteSequencer, globalClockState) => {
		if (!infiniteSequencer) return emptyArray
		if (!infiniteSequencer.isPlaying) return emptyArray

		const globalClockIndex = globalClockState.index

		const index = globalClockIndex

		if (index >= 0 && infiniteSequencer.events.length > 0) {
			return infiniteSequencer.events[index % infiniteSequencer.events.length].notes
		} else {
			return emptyArray
		}
	},
)
