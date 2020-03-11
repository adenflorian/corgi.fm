import {combineReducers} from 'redux'
import {ActionType} from 'typesafe-actions'
import {Map} from 'immutable'
import {
	BROADCASTER_ACTION, SERVER_ACTION,
} from '..'
import {expPositionsReducer, makeExpPositionsState, expConnectionsReducer, makeExpConnectionsState,
	expNodesReducer, ExpNodeState, makeExpNodeState, expGraphMetaReducer, makeExpGraphMeta} from '.'

export const expGraphActions = {
} as const

export function makeExpGraph(graph: Partial<ExpGraph> = {}): ExpGraph {
	return {
		meta: makeExpGraphMeta(graph.meta),
		nodes: Map<Id, ExpNodeState>(graph.nodes || []).map(makeExpNodeState),
		connections: makeExpConnectionsState(graph.connections),
		positions: makeExpPositionsState(graph.positions),
	}
}

export interface ExpGraph extends ReturnType<typeof expGraphReducer> {}

export type ExpGraphAction = ActionType<typeof expGraphActions>

// Reducers
export const expGraphReducer = combineReducers({
	meta: expGraphMetaReducer,
	nodes: expNodesReducer,
	connections: expConnectionsReducer,
	positions: expPositionsReducer,
})
