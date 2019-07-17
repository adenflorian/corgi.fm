import {Map} from 'immutable'
import {AnyAction} from 'redux'
import {IConnection} from '..'

export type ShamuEdgesState = ReturnType<typeof makeShamuEdgesState>

export function makeShamuEdgesState() {
	return Map<string, EdgeState>()
}

export type EdgeState = IConnection

export function edgesReducer(state = makeShamuEdgesState(), action: AnyAction) {
	return state
}
