import {combineReducers} from 'redux'
import {StateType} from 'typesafe-actions'
import {
	edgesReducer, nodesReducer,
} from './index'

export type ShamuGraphState = StateType<typeof shamuGraphReducer>

export const shamuGraphReducer = combineReducers({
	nodes: nodesReducer,
	edges: edgesReducer,
})
