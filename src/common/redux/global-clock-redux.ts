import {Record} from 'immutable'
import {Reducer} from 'redux'
import {BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION} from './index'

export const REPLACE_GLOBAL_CLOCK_STATE = 'REPLACE_GLOBAL_CLOCK_STATE'
export type ReplaceGlobalClockStateAction = ReturnType<typeof replaceGlobalClockState>
export const replaceGlobalClockState = (globalClockState: IGlobalClockState) => ({
	type: REPLACE_GLOBAL_CLOCK_STATE as typeof REPLACE_GLOBAL_CLOCK_STATE,
	globalClockState,
})

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
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const RESTART_GLOBAL_CLOCK = 'RESTART_GLOBAL_CLOCK'
export type RestartGlobalClockAction = ReturnType<typeof restartGlobalClock>
export const restartGlobalClock = () => ({
	type: RESTART_GLOBAL_CLOCK as typeof RESTART_GLOBAL_CLOCK,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

const defaultGlobalClockState = {
	index: -1,
	isPlaying: false,
	playCount: 0,
}

const makeGlobalClockState = Record(defaultGlobalClockState)

const initialState = makeGlobalClockState()

export type GlobalClockAction = SetGlobalClockIndexAction |
	SetGlobalClockIsPlayingAction | ReplaceGlobalClockStateAction | RestartGlobalClockAction

export type IGlobalClockState = typeof initialState

export const globalClockReducer: Reducer<IGlobalClockState, GlobalClockAction> =
	(state = initialState, action) => {
		switch (action.type) {
			case REPLACE_GLOBAL_CLOCK_STATE: return makeGlobalClockState(action.globalClockState)
			case SET_GLOBAL_CLOCK_INDEX: return state.set('index', action.index)
			case SET_GLOBAL_CLOCK_IS_PLAYING: return state.set('isPlaying', action.isPlaying)
			case RESTART_GLOBAL_CLOCK: return state.set('isPlaying', true).update('playCount', x => x + 1)
			default: return state
		}
	}

export const selectGlobalClockState = (state: IClientRoomState) =>
	state.globalClock

export const selectGlobalClockIsPlaying = (state: IClientRoomState) =>
	selectGlobalClockState(state).isPlaying
