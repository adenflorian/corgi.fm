import {Record, Map} from 'immutable'
import {Reducer, combineReducers} from 'redux'
import {ActionType} from 'typesafe-actions'
import {
	expGraphsReducer, makeExpGraphsState,
} from '.'
import {InitAction} from '../common-actions'
import {expMidiReducer, makeExpMidiState} from './exp-midi-redux'
import {IClientRoomState} from '../common-redux-types'
import {RoomType} from '../../common-types'
import {expKeyboardsReducer, makeExpKeyboardState, ExpKeyboardState} from './exp-keyboard-keys-redux'

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
	keyboards: expKeyboardsReducer,
})

const defaultExpProjectState = Object.freeze({
	state: innerReducers(undefined, {type: '$$$$INIT'}),
	activityType: RoomType.Experimental,
})

const _makeExpProjectState = Record(defaultExpProjectState)

export function makeExpProjectState(expProjectsState: ExpProjectState) {
	return _makeExpProjectState(expProjectsState)
		.set('state', {
			graphs: makeExpGraphsState(expProjectsState.state.graphs),
			midi: makeExpMidiState(expProjectsState.state.midi),
			keyboards: Map<Id, ExpKeyboardState>(expProjectsState.state.keyboards || []).map(makeExpKeyboardState),
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

export const selectActivityType = (state: IClientRoomState) => state.activity.activityType
