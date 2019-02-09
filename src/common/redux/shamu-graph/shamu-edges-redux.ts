import {Map} from 'immutable'
import {Action} from 'redux'
import {IConnection} from '../index'

export type ShamuEdgesState = ReturnType<typeof makeShamuEdgesState>

export function makeShamuEdgesState() {
	return Map<string, EdgeState>()
}

export type EdgeState = IConnection

export function edgesReducer(state = makeShamuEdgesState(), action: Action) {
	return state
}
