
import {combineReducers} from 'redux'
import {ActionType} from 'typesafe-actions'
import {
	BROADCASTER_ACTION, SERVER_ACTION,
} from '..'
import {expGraphMetaReducer} from './exp-graph-meta-redux'
import {expNodesReducer} from './exp-nodes-redux'
import {expConnectionsReducer} from './exp-connections-redux'
import {expPositionsReducer} from './exp-positions-redux'

export const expGraphActions = {
	add: (graph: ExpGraph) => ({
		type: 'EXP_GRAPH_ADD',
		graph,
	})
} as const

// export function makeExpGraph(graph: Partial<typeof defaultExpGraph>): ExpGraph {
// 	return makeExpGraphRecord(graph)
// 		.set('meta', makeExpGraphMeta(graph.meta))
// 		.set('nodes', Map<Id, ExpNodeState>())
// 		.set('connections', makeInitialExpConnectionsState())
// 		.set('positions', makeExpPositionsState())
// }

export type ExpGraph = ReturnType<typeof expGraphReducer>

export type ExpGraphAction = ActionType<typeof expGraphActions>

// Reducers
export const expGraphReducer = combineReducers({
	meta: expGraphMetaReducer,
	nodes: expNodesReducer,
	connections: expConnectionsReducer,
	positions: expPositionsReducer,
})
