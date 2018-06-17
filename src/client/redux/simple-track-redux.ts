import {IAppState} from './configureStore'

export const SET_TRACK_SIMPLE_TRACK_NOTE = 'SET_TRACK_SIMPLE_TRACK_NOTE'

export const setSimpleTrackNote = (index: number, enabled: boolean) => {
	return {
		type: SET_TRACK_SIMPLE_TRACK_NOTE,
		index,
		enabled,
	}
}

export type ISimpleTrackState = boolean[]

const initialState: ISimpleTrackState = [
	false,
	false,
	false,
	false,
]

export function simpleTrackReducer(state: ISimpleTrackState = initialState, action) {
	switch (action.type) {
		case SET_TRACK_SIMPLE_TRACK_NOTE:
			const newState = state.slice()
			newState[action.index] = action.enabled
			return newState
		default:
			return state
	}
}

export function selectSimpleTrackState(state: IAppState) {
	return state.simpleTrack
}
