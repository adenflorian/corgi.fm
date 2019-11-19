import {Map, Record} from 'immutable'
import {Reducer} from 'redux'
import {ActionType} from 'typesafe-actions'
import {IClientRoomState} from '../common-redux-types'
import {ExpGraph, expGraphReducer, makeExpGraph} from './exp-graph-redux'
import {ExpNodeType} from './exp-nodes-redux'
import {
	BROADCASTER_ACTION, SERVER_ACTION,
} from '..'

export const expGraphsActions = {
	add: (graph: ExpGraph) => ({
		type: 'EXP_GRAPHS_ADD',
		graph,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	replaceAll: (expGraphsState: ExpGraphsState) => ({
		type: 'EXP_GRAPHS_REPLACE_ALL',
		expGraphsState,
	} as const),
} as const

export interface ExpGraphsState extends ReturnType<typeof _makeExpGraphsState> {}

const defaultExpGraphsState = Object.freeze({
	all: Map<Id, ExpGraph>(),
	mainGraph: expGraphReducer(undefined, {type: '$$$$INIT'}),
})

const _makeExpGraphsState = Record(defaultExpGraphsState)

function makeExpGraphsState(expGraphsState: ExpGraphsState) {
	return _makeExpGraphsState(expGraphsState)
		.set('all', Map(expGraphsState.all).map(makeExpGraph))
		.set('mainGraph', makeExpGraph(expGraphsState.mainGraph))
}

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
		case 'EXP_GRAPHS_REPLACE_ALL': return makeExpGraphsState(action.expGraphsState)
		case 'EXP_GRAPHS_ADD': {
			return state.update('all', all => all.set(action.graph.meta.id, makeExpGraph(action.graph)))
		}
		default: return state
	}
}

export function selectExpGraphsState(state: IClientRoomState) {
	return state.expGraphs
}

export function selectMainExpGraph(state: IClientRoomState) {
	return selectExpGraphsState(state).mainGraph
}

export function selectPresetsForExpNodeTypeSlow(state: IClientRoomState, nodeType: ExpNodeType) {
	return selectExpGraphsState(state).all.filter(x => x.nodes.count() === 1 && x.nodes.some(y => y.type === nodeType))
}

export function selectGraphPresetsSlow(state: IClientRoomState) {
	return selectExpGraphsState(state).all.filter(x => x.nodes.count() > 1)
}

export function selectPreset(state: IClientRoomState, presetId: Id) {
	return selectExpGraphsState(state).all.get(presetId)
}
