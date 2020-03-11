import {Map, Record} from 'immutable'
import {Reducer} from 'redux'
import {ActionType} from 'typesafe-actions'
import {
	BROADCASTER_ACTION, SERVER_ACTION, IClientRoomState, InitAction,
} from '..'
import {ExpNodeType, ExpGraph, expGraphReducer, makeExpGraph} from '.'
import {selectExpGraphsState} from './exp-common-redux'

export const expGraphsActions = {
	add: (graph: ExpGraph) => ({
		type: 'EXP_GRAPHS_ADD',
		graph,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
} as const

export interface ExpGraphsState extends ReturnType<typeof _makeExpGraphsState> {}

const defaultExpGraphsState = Object.freeze({
	all: Map<Id, ExpGraph>(),
	mainGraph: expGraphReducer(undefined, {type: '$$$$INIT'}),
})

const _makeExpGraphsState = Record(defaultExpGraphsState)

export function makeExpGraphsState(expGraphsState: ExpGraphsState) {
	return _makeExpGraphsState(expGraphsState)
		.set('all', Map(expGraphsState.all).map(makeExpGraph))
		.set('mainGraph', makeExpGraph(expGraphsState.mainGraph))
}

const defaultExpGraphsStateRecord = _makeExpGraphsState()

export type ExpGraphs = Map<Id, ExpGraph>

export type ExpGraphsAction = ActionType<typeof expGraphsActions>

export const expGraphsReducer: Reducer<ExpGraphsState, ExpGraphsAction | InitAction> = (
	state = defaultExpGraphsStateRecord, action,
) => {
	const {mainGraph} = state
	const newMainGraphState = expGraphReducer(mainGraph, action)
	if (newMainGraphState !== mainGraph) {
		return state.set('mainGraph', newMainGraphState)
	}
	switch (action.type) {
		case 'EXP_GRAPHS_ADD': {
			return state.update('all', all => all.set(action.graph.meta.id, makeExpGraph(action.graph)))
		}
		default: return state
	}
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
