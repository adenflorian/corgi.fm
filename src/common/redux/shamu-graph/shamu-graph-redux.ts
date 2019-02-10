import {Map} from 'immutable'
import {combineReducers} from 'redux'
import {ActionType, StateType} from 'typesafe-actions'
import {ConnectionNodeType} from '../../common-types'
import {IClientRoomState} from '../index'
import {IMultiState, IMultiStateThings} from '../multi-reducer'
import {getConnectionNodeInfo} from '../node-types'
import {
	edgesReducer, nodesReducer,
} from './index'
import {makeShamuEdgesState} from './shamu-edges-redux'
// import {makeShamuNodesState} from './shamu-nodes-redux'

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
			nodes: Object.freeze({
				basicSynthesizers: deserialize(ConnectionNodeType.basicSynthesizer, action.shamuGraphState.nodes.basicSynthesizers),
				basicSamplers: deserialize(ConnectionNodeType.basicSampler, action.shamuGraphState.nodes.basicSamplers),
				gridSequencers: deserialize(ConnectionNodeType.gridSequencer, action.shamuGraphState.nodes.gridSequencers),
				infiniteSequencers: deserialize(ConnectionNodeType.infiniteSequencer, action.shamuGraphState.nodes.infiniteSequencers),
				virtualKeyboards: deserialize(ConnectionNodeType.virtualKeyboard, action.shamuGraphState.nodes.virtualKeyboards),
			}),
			edges: makeShamuEdgesState().merge(action.shamuGraphState.edges),
		}
		default: return shamuGraphCombinedReducers(state, action)
	}
}

function deserialize<T extends IMultiState>(type: ConnectionNodeType, multiState: T): T {
	return Object.freeze({
		...multiState,
		things: Map(multiState.things)
			.map(getConnectionNodeInfo(type).stateDeserializer)
			.toObject(),
	})
}

export const selectShamuGraphState = (state: IClientRoomState) => state.shamuGraph
