import {Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION} from '.'

export const globalClockActions = {
	replace: (globalClockState: IGlobalClockState) => ({
		type: 'REPLACE_GLOBAL_CLOCK_STATE',
		globalClockState,
	} as const),
	start: () => ({
		type: 'START_GLOBAL_CLOCK',
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	stop: () => ({
		type: 'STOP_GLOBAL_CLOCK',
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	restart: () => ({
		type: 'RESTART_GLOBAL_CLOCK',
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	update: (
		update: Partial<Pick<IGlobalClockState, 'bpm' | 'maxReadAheadSeconds'>>,
	) => ({
		type: 'UPDATE_GLOBAL_CLOCK',
		update,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
} as const

const defaultGlobalClockState = {
	index: -1,
	isPlaying: false,
	playCount: 0,
	bpm: 120,
	maxReadAheadSeconds: 0.2,
}

const makeGlobalClockState = Record(defaultGlobalClockState)

const initialState = makeGlobalClockState()

export type GlobalClockAction = ActionType<typeof globalClockActions>

export type IGlobalClockState = typeof initialState

export const globalClockReducer =
	(state = initialState, action: GlobalClockAction) => {
		switch (action.type) {
			case 'REPLACE_GLOBAL_CLOCK_STATE': return makeGlobalClockState(action.globalClockState)
			case 'START_GLOBAL_CLOCK': return state.set('isPlaying', true)
			case 'STOP_GLOBAL_CLOCK': return state.set('isPlaying', false).set('index', -1)
			case 'RESTART_GLOBAL_CLOCK': return state.set('isPlaying', true).update('playCount', x => x + 1)
			case 'UPDATE_GLOBAL_CLOCK': return state.merge(action.update)
			default: return state
		}
	}

export const selectGlobalClockState = (state: IClientRoomState) =>
	state.globalClock

export const selectGlobalClockIsPlaying = (state: IClientRoomState) =>
	selectGlobalClockState(state).isPlaying
