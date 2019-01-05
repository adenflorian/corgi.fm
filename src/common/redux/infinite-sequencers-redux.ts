import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {hashbow} from '../../client/utils'
import {IMidiNote} from '../MidiNote'
import {addIfNew} from '../server-common'
import {colorFunc} from '../shamu-color'
import {IClientRoomState} from './common-redux-types'
import {
	addMultiThing, deleteThings, IMultiState,
	IMultiStateThing, IMultiStateThings, makeMultiReducer, MultiThingType, updateThings,
} from './multi-reducer'
import {BROADCASTER_ACTION, NetworkActionType, SERVER_ACTION} from './redux-utils'

export const ADD_INFINITE_SEQUENCER = 'ADD_INFINITE_SEQUENCER'
export const addInfiniteSequencer = (infiniteSequencer: IInfiniteSequencerState) =>
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

export const EXPORT_INFINITE_SEQUENCER_MIDI = 'EXPORT_INFINITE_SEQUENCER_MIDI'
export type ExportInfiniteSequencerMidiAction = ReturnType<typeof exportInfiniteSequencerMidi>
export const exportInfiniteSequencerMidi = (infiniteSequencerId: string) => ({
	type: EXPORT_INFINITE_SEQUENCER_MIDI,
	infiniteSequencerId,
})

export const SET_INFINITE_SEQUENCER_FIELD = 'SET_INFINITE_SEQUENCER_FIELD'
export type SetInfiniteSequencerField = ReturnType<typeof setInfiniteSequencerField>
export const setInfiniteSequencerField = (id: string, fieldName: 'isPlaying' | 'bottomNote' | 'index', data: any) => ({
	type: SET_INFINITE_SEQUENCER_FIELD,
	id,
	fieldName,
	data,
})

export interface IInfiniteSequencerEvent {
	notes: IMidiNote[]
}

export interface IInfiniteSequencersState extends IMultiState {
	things: IInfiniteSequencers
}

export interface IInfiniteSequencers extends IMultiStateThings {
	[key: string]: IInfiniteSequencerState
}

export interface ISequencerState extends IMultiStateThing {
	events: IInfiniteSequencerEvent[]
	index: number
	isPlaying: boolean
	id: string
	color: string
	name: string
}

export type IInfiniteSequencerState = ISequencerState

export class InfiniteSequencerState implements IInfiniteSequencerState {
	public readonly id: string = uuid.v4()
	public readonly events: IInfiniteSequencerEvent[]
	public readonly index: number = -1
	public readonly isPlaying: boolean = false
	public readonly color: string
	public readonly name: string

	constructor(name: string, events?: IInfiniteSequencerEvent[]) {
		this.name = name
		this.color = colorFunc(hashbow(this.id)).desaturate(0.2).hsl().string()
		this.events = events ||
			[{notes: [44]}, {notes: [45]}, {notes: [46]}, {notes: [47]},
			{notes: [48]}, {notes: [49]}, {notes: [50]}, {notes: [51]}]
	}
}

export interface IInfiniteSequencerEvent {
	notes: IMidiNote[]
}

export const infiniteSequencerActionTypes = [
	SET_INFINITE_SEQUENCER_NOTE,
	SET_INFINITE_SEQUENCER_FIELD,
]

export const infiniteSequencersReducer =
	makeMultiReducer<IInfiniteSequencerState, IInfiniteSequencersState>(
		infiniteSequencerReducer, MultiThingType.infiniteSequencer, infiniteSequencerActionTypes)

function infiniteSequencerReducer(infiniteSequencer: IInfiniteSequencerState, action: AnyAction) {
	switch (action.type) {
		case SET_INFINITE_SEQUENCER_NOTE:
			if (action.note === undefined) {
				throw new Error('action.notes === undefined')
			}
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
			}
		case SET_INFINITE_SEQUENCER_FIELD:
			return {...infiniteSequencer, [action.fieldName]: action.data}
		default:
			throw new Error('invalid action type')
	}
}

export const selectAllInfiniteSequencers = (state: IClientRoomState) => state.infiniteSequencers.things
