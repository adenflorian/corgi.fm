import {IAppState} from './configureStore'

export const SET_TRACK_SIMPLE_TRACK_NOTE = 'SET_TRACK_SIMPLE_TRACK_NOTE'
export const setSimpleTrackNote = (index: number, enabled: boolean) => {
	return {
		type: SET_TRACK_SIMPLE_TRACK_NOTE,
		index,
		enabled,
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
	notes: boolean[]
	index: number
}

const initialState: ISimpleTrackState = {
	notes: [
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
	],
	index: -1,
}

export function simpleTrackReducer(state: ISimpleTrackState = initialState, action) {
	switch (action.type) {
		case SET_TRACK_SIMPLE_TRACK_NOTE:
			const newNotes = state.notes.slice()
			newNotes[action.index] = action.enabled
			return {...state, notes: newNotes}
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
