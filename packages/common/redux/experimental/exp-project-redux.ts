import {Map, Record} from 'immutable'
import {Reducer, combineReducers} from 'redux'
import {ActionType} from 'typesafe-actions'
import {
	BROADCASTER_ACTION, SERVER_ACTION, IClientRoomState,
} from '..'
import {
	expGraphsReducer, makeExpGraphsState,
} from '.'
import {InitAction} from '../common-actions'

export const expProjectActions = {
} as const

interface ReplaceAction {
	readonly type: 'ACTIVITY_REPLACE'
	readonly activityState: ExpProjectState
}

export interface ExpProjectState extends ReturnType<typeof _makeExpProjectState> {}

// Reducers
const innerReducers = combineReducers({
	graphs: expGraphsReducer,
})

const defaultExpProjectState = Object.freeze({
	state: innerReducers(undefined, {type: '$$$$INIT'}),
	activityType: 'expCorgi' as const,
})

const _makeExpProjectState = Record(defaultExpProjectState)

export function makeExpProjectState(expProjectsState: ExpProjectState) {
	return _makeExpProjectState(expProjectsState)
		.set('state', {
			graphs: makeExpGraphsState(expProjectsState.state.graphs),
		})
}

const defaultExpProjectStateRecord = _makeExpProjectState()

export type ExpProjectAction = ActionType<typeof expProjectActions>

export const expProjectReducer: Reducer<ExpProjectState, ExpProjectAction | ReplaceAction | InitAction> = (
	state = defaultExpProjectStateRecord, action,
) => {
	switch (action.type) {
		case 'ACTIVITY_REPLACE': return makeExpProjectState(action.activityState)
		default: {
			const result = innerReducers(state.state, action)
			if (result === state.state) return state
			return state.set('state', result)
		}
	}
}
