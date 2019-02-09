import {Action} from 'redux'
import {IConnection} from '../index'

export type ShamuEdgesState = Map<string, EdgeState>

export type EdgeState = IConnection

export function edgesReducer(state = {}, action: Action) {
	return state
}
