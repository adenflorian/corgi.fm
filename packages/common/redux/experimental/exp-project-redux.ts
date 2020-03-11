import {Record} from 'immutable'
import {Reducer, combineReducers} from 'redux'
import {ActionType} from 'typesafe-actions'
import {
	expGraphsReducer, makeExpGraphsState,
} from '.'
import {InitAction} from '../common-actions'
import {expMidiReducer, makeExpMidiState} from './exp-midi-redux'

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
	midi: expMidiReducer,
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
			midi: makeExpMidiState(expProjectsState.state.midi),
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
