import {Map, Record} from 'immutable'
import {Reducer} from 'redux'
import {ActionType} from 'typesafe-actions'
import {
	BROADCASTER_ACTION, SERVER_ACTION,
} from '..'
import {ExpGraph, expGraphReducer} from './exp-graph-redux'

export const expGraphsActions = {
	add: (graph: ExpGraph, isMain?: boolean) => ({
		type: 'EXP_GRAPHS_ADD',
		graph,
		isMain,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const)
} as const

export interface ExpGraphsState extends ReturnType<typeof _makeExpGraphsState> {}

const defaultExpGraphsState = Object.freeze({
	all: Map() as ExpGraphs,
	mainGraph: expGraphReducer(undefined, {type: '$$$$INIT'}),
})

const _makeExpGraphsState = Record(defaultExpGraphsState)

const defaultExpGraphsStateRecord = _makeExpGraphsState()

export type ExpGraphs = Map<Id, ExpGraph>

export type ExpGraphsAction = ActionType<typeof expGraphsActions>

export const expGraphsReducer: Reducer<ExpGraphsState, ExpGraphsAction> = (
	state = defaultExpGraphsStateRecord, action,
) => {
	const {mainGraph} = state
	const newMainGraphState = expGraphReducer(mainGraph, action)
	if (newMainGraphState !== mainGraph) {
		return state.set('mainGraph', newMainGraphState)
	}
	switch (action.type) {
		case 'EXP_GRAPHS_ADD': {
			if (action.isMain) {
				return state.set('mainGraph', action.graph)
			} else {
				return state.update('all', all => all.set(action.graph.meta.id, action.graph))
			}
		}
		default: return state
	}
}
