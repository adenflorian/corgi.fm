import {List, Stack} from 'immutable'
import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {hashbow} from '../../client/utils'
import {IMidiNote} from '../MidiNote'
import {addIfNew} from '../server-common'
import {colorFunc} from '../shamu-color'
import {PLAY_ALL, STOP_ALL} from './common-actions'
import {IClientRoomState} from './common-redux-types'
import {
	addMultiThing, deleteThings, IMultiState,
	IMultiStateThing, IMultiStateThings, makeMultiReducer, MultiThingType, updateThings,
} from './multi-reducer'
import {BROADCASTER_ACTION, NetworkActionType, SERVER_ACTION} from './redux-utils'
import {CLEAR_SEQUENCER, createSequencerEvents, UNDO_SEQUENCER} from './sequencer-redux'
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
}

export interface IInfiniteSequencerEvent {
	notes: IMidiNote[]
}

export interface IInfiniteSequencersState extends IMultiState {
	things: IInfiniteSequencers
}

export interface IInfiniteSequencers extends IMultiStateThings {
	[key: string]: InfiniteSequencerState
}

export interface ISequencerState extends IMultiStateThing {
	events: IInfiniteSequencerEvent[]
	index: number
	isPlaying: boolean
	id: string
	color: string
	name: string
	isRecording: boolean
	previousEvents: IInfiniteSequencerEvent[][]
}

export enum InfiniteSequencerStyle {
	colorBars = 'colorBars',
	colorGrid = 'colorGrid',
}

export class InfiniteSequencerState implements ISequencerState {
	public readonly id: string = uuid.v4()
	public readonly events: IInfiniteSequencerEvent[]
	public readonly index: number = -1
	public readonly isPlaying: boolean = false
	public readonly color: string
	public readonly name: string
	public readonly isRecording: boolean = false
	public readonly style: InfiniteSequencerStyle
	public readonly previousEvents: IInfiniteSequencerEvent[][] = []

	constructor(name: string, style: InfiniteSequencerStyle, events?: IInfiniteSequencerEvent[]) {
		this.name = name
		this.color = colorFunc(hashbow(this.id)).desaturate(0.2).hsl().string()
		this.events = events ||
			[{notes: [44]}, {notes: [45]}, {notes: [46]}, {notes: [47]},
			{notes: [48]}, {notes: [49]}, {notes: [50]}, {notes: [51]}]
		this.style = style
	}
}

export interface IInfiniteSequencerEvent {
	notes: IMidiNote[]
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
					events: [],
					previousEvents: [infiniteSequencer.events, ...infiniteSequencer.previousEvents],
				}
			} else if (action.fieldName === InfiniteSequencerFields.index) {
				return {
					...infiniteSequencer,
					[action.fieldName]: action.data % infiniteSequencer.events.length,
				}
			} else {
				return {
					...infiniteSequencer,
					[action.fieldName]: action.data,
				}
			}
		case UNDO_SEQUENCER: {
			if (infiniteSequencer.previousEvents.length > 0) {
				const prv = Stack(infiniteSequencer.previousEvents)
				return {
					...infiniteSequencer,
					events: prv.first(),
					previousEvents: prv.shift().toJS(),
				}
			} else {
				return infiniteSequencer
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
		case STOP_ALL: return {...infiniteSequencer, isPlaying: false}
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
		default:
			return infiniteSequencer
	}
}

export const selectAllInfiniteSequencers = (state: IClientRoomState) => state.infiniteSequencers.things
