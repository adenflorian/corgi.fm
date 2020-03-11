import {Map, Record} from 'immutable'
import {Reducer, AnyAction} from 'redux'
import {ActionType} from 'typesafe-actions'
import {IClientRoomState} from './common-redux-types'
import {ExpNodeType} from './experimental/exp-nodes-redux'
import {
	BROADCASTER_ACTION, SERVER_ACTION, expGraphsReducer, makeExpGraphsState, expProjectReducer,
} from '.'

interface DummyActivityState {
	readonly activityType: 'dummy'
}

export function dummyActivityReducer(state: DummyActivityState = {activityType: 'dummy'}, action: AnyAction): DummyActivityState {
	return state
}
