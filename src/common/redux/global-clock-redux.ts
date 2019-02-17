import {Record} from 'immutable'
import {Reducer} from 'redux'
import {PLAY_ALL, STOP_ALL} from './common-actions'
import {IClientRoomState} from './index'

export const SET_GLOBAL_CLOCK_INDEX = 'SET_GLOBAL_CLOCK_INDEX'
export type SetGlobalClockIndexAction = ReturnType<typeof setGlobalClockIndex>
export const setGlobalClockIndex = (index: number) => ({
	type: SET_GLOBAL_CLOCK_INDEX as typeof SET_GLOBAL_CLOCK_INDEX,
	index,
})

export const SET_GLOBAL_CLOCK_IS_PLAYING = 'SET_GLOBAL_CLOCK_IS_PLAYING'
export type SetGlobalClockIsPlayingAction = ReturnType<typeof setGlobalClockIsPlaying>
export const setGlobalClockIsPlaying = (isPlaying: boolean) => ({
	type: SET_GLOBAL_CLOCK_IS_PLAYING as typeof SET_GLOBAL_CLOCK_IS_PLAYING,
	isPlaying,
})

const initialState = Record({
	index: -1,
	isPlaying: false,
})()

export type GlobalClockAction = SetGlobalClockIndexAction & SetGlobalClockIsPlayingAction

export type IGlobalClockState = typeof initialState

export const globalClockReducer: Reducer<IGlobalClockState, GlobalClockAction> =
	(state = initialState, action) => {
		switch (action.type) {
			case SET_GLOBAL_CLOCK_INDEX: return state.set('index', action.index)
			case SET_GLOBAL_CLOCK_IS_PLAYING: return state.set('isPlaying', action.isPlaying)
			case PLAY_ALL: return state.set('isPlaying', true)
			case STOP_ALL: return state.set('isPlaying', false)
			default: return state
		}
	}

export const selectGlobalClockState = (state: IClientRoomState) =>
	state.globalClock

export const selectGlobalClockIsPlaying = (state: IClientRoomState) =>
	selectGlobalClockState(state).isPlaying
