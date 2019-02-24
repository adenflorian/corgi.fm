import {Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION} from './index'

export const REPLACE_GLOBAL_CLOCK_STATE = 'REPLACE_GLOBAL_CLOCK_STATE'
export const SET_GLOBAL_CLOCK_INDEX = 'SET_GLOBAL_CLOCK_INDEX'
export const START_GLOBAL_CLOCK = 'START_GLOBAL_CLOCK'
export const STOP_GLOBAL_CLOCK = 'STOP_GLOBAL_CLOCK'
export const RESTART_GLOBAL_CLOCK = 'RESTART_GLOBAL_CLOCK'
export const UPDATE_GLOBAL_CLOCK = 'UPDATE_GLOBAL_CLOCK'

export const globalClockActions = Object.freeze({
	replace: (globalClockState: IGlobalClockState) => ({
		type: REPLACE_GLOBAL_CLOCK_STATE as typeof REPLACE_GLOBAL_CLOCK_STATE,
		globalClockState,
	}),
	setIndex: (index: number) => ({
		type: SET_GLOBAL_CLOCK_INDEX as typeof SET_GLOBAL_CLOCK_INDEX,
		index,
	}),
	start: () => ({
		type: START_GLOBAL_CLOCK as typeof START_GLOBAL_CLOCK,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	stop: () => ({
		type: STOP_GLOBAL_CLOCK as typeof STOP_GLOBAL_CLOCK,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	restart: () => ({
		type: RESTART_GLOBAL_CLOCK as typeof RESTART_GLOBAL_CLOCK,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	update: (
		update: Partial<Pick<IGlobalClockState, 'bpm' | 'eventOffsetSeconds'
			| 'eventWindowSeconds' | 'maxReadAheadSeconds' | 'maxReadWindowSeconds'>>,
	) => ({
		type: UPDATE_GLOBAL_CLOCK as typeof UPDATE_GLOBAL_CLOCK,
		update,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
})

const defaultGlobalClockState = {
	index: -1,
	isPlaying: false,
	playCount: 0,
	bpm: 20,
	eventWindowSeconds: 1,
	eventOffsetSeconds: 2,
	maxReadAheadSeconds: 0.1,
	maxReadWindowSeconds: 0.1,
}

const makeGlobalClockState = Record(defaultGlobalClockState)

const initialState = makeGlobalClockState()

export type GlobalClockAction = ActionType<typeof globalClockActions>

export type IGlobalClockState = typeof initialState

export const globalClockReducer =
	(state = initialState, action: GlobalClockAction) => {
		switch (action.type) {
			case REPLACE_GLOBAL_CLOCK_STATE: return makeGlobalClockState(action.globalClockState)
			case SET_GLOBAL_CLOCK_INDEX: return state.set('index', action.index)
			case START_GLOBAL_CLOCK: return state.set('isPlaying', true)
			case STOP_GLOBAL_CLOCK: return state.set('isPlaying', false).set('index', -1)
			case RESTART_GLOBAL_CLOCK: return state.set('isPlaying', true).update('playCount', x => x + 1)
			case UPDATE_GLOBAL_CLOCK: return state.merge(action.update)
			default: return state
		}
	}

export const selectGlobalClockState = (state: IClientRoomState) =>
	state.globalClock

export const selectGlobalClockIsPlaying = (state: IClientRoomState) =>
	selectGlobalClockState(state).isPlaying
