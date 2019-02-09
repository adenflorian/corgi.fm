import {combineReducers} from 'redux'
import {ActionType, StateType} from 'typesafe-actions'
import {IClientRoomState} from '../index'
import {
	edgesReducer, nodesReducer,
} from './index'
import {makeShamuEdgesState} from './shamu-edges-redux'
import {makeShamuNodesState} from './shamu-nodes-redux'

export const REPLACE_SHAMU_GRAPH_STATE = 'REPLACE_SHAMU_GRAPH_STATE'

export const shamuGraphActions = Object.freeze({
	replace: (shamuGraphState: ShamuGraphState) => ({
		type: REPLACE_SHAMU_GRAPH_STATE as typeof REPLACE_SHAMU_GRAPH_STATE,
		shamuGraphState,
	}),
})

export type ShamuGraphAction = ActionType<typeof shamuGraphActions>

export type ShamuGraphState = StateType<typeof shamuGraphCombinedReducers>

const shamuGraphCombinedReducers = combineReducers({
	nodes: nodesReducer,
	edges: edgesReducer,
})

export function shamuGraphReducer(state: ShamuGraphState | undefined, action: ShamuGraphAction) {
	switch (action.type) {
		case REPLACE_SHAMU_GRAPH_STATE: return {
			nodes: makeShamuNodesState().merge(action.shamuGraphState.nodes),
			edges: makeShamuEdgesState().merge(action.shamuGraphState.edges),
		}
		default: return shamuGraphCombinedReducers(state, action)
	}
}

export const selectShamuGraphState = (state: IClientRoomState) => state.shamuGraph
