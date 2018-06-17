import {IMidiNote} from '../MIDI/MidiNote'
import {IAppState} from './configureStore'
import {addIfNew} from './virtual-keyboard-redux'

export const SET_SIMPLE_TRACK_NOTE = 'SET_TRACK_SIMPLE_TRACK_NOTE'
export const setSimpleTrackNote = (index: number, enabled: boolean, note: IMidiNote) => {
	return {
		type: SET_SIMPLE_TRACK_NOTE,
		index,
		enabled,
		note,
	}
}

export const SET_SIMPLE_TRACK_INDEX = 'SET_SIMPLE_TRACK_INDEX'
export const setSimpleTrackIndex = (index: number) => {
	return {
		type: SET_SIMPLE_TRACK_INDEX,
		index,
	}
}

export interface ISimpleTrackState {
	notes: ISimpleTrackNote[]
	index: number
}

export interface ISimpleTrackNote {
	notes: IMidiNote[]
}

const initialState: ISimpleTrackState = {
	notes: [
		{notes: []},
		{notes: []},
		{notes: []},
		{notes: []},
		{notes: []},
		{notes: []},
		{notes: []},
		{notes: []},
	],
	index: -1,
}

export function simpleTrackReducer(state: ISimpleTrackState = initialState, action) {
	switch (action.type) {
		case SET_SIMPLE_TRACK_NOTE:
			if (action.note === undefined) {
				throw new Error('action.notes === undefined')
			}
			return {
				...state,
				notes: state.notes.map((event, eventIndex) => {
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
		case SET_SIMPLE_TRACK_INDEX:
			return {...state, index: action.index}
		default:
			return state
	}
}

export function selectSimpleTrackNotes(state: IAppState) {
	return state.simpleTrack.notes
}

export function selectSimpleTrackIndex(state: IAppState) {
	return state.simpleTrack.index
}
