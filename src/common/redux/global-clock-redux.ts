import {Record} from 'immutable'
import {Reducer} from 'redux'
import {IClientRoomState} from './index'

export const SET_GLOBAL_CLOCK_INDEX = 'SET_GLOBAL_CLOCK_INDEX'
export type SetGlobalClockIndexAction = ReturnType<typeof setGlobalClockIndex>
export const setGlobalClockIndex = (index: number) => ({
	type: SET_GLOBAL_CLOCK_INDEX as typeof SET_GLOBAL_CLOCK_INDEX,
	index,
})

const initialState = Record({
	index: -1,
})()

export type IGlobalClockState = typeof initialState

export const globalClockReducer: Reducer<IGlobalClockState> =
	(state = initialState, action) => {
		switch (action.type) {
			case SET_GLOBAL_CLOCK_INDEX: return state.merge({index: action.index})
			default: return state
		}
	}

export const selectGlobalClockState = (state: IClientRoomState) => state.globalClock
