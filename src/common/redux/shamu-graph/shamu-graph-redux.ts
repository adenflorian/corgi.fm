import {Map} from 'immutable'
import {combineReducers} from 'redux'
import {ActionType, StateType} from 'typesafe-actions'
import {ConnectionNodeType} from '../../common-types'
import {logger} from '../../logger'
import {BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION} from '../index'
import {IMultiState} from '../multi-reducer'
import {getConnectionNodeInfo} from '../node-types'
import {
	edgesReducer, nodesReducer,
} from './index'
import {makeShamuEdgesState} from './shamu-edges-redux'

export const REPLACE_SHAMU_GRAPH_STATE = 'REPLACE_SHAMU_GRAPH_STATE'
export const MERGE_SHAMU_GRAPH_STATE = 'MERGE_SHAMU_GRAPH_STATE'

export const shamuGraphActions = Object.freeze({
	replace: (shamuGraphState: ShamuGraphState) => ({
		type: REPLACE_SHAMU_GRAPH_STATE as typeof REPLACE_SHAMU_GRAPH_STATE,
		shamuGraphState,
	}),
	merge: (shamuGraphState: ShamuGraphState) => ({
		type: MERGE_SHAMU_GRAPH_STATE as typeof MERGE_SHAMU_GRAPH_STATE,
		shamuGraphState,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
})

export type ShamuGraphAction = ActionType<typeof shamuGraphActions>

export type ShamuGraphState = StateType<typeof shamuGraphCombinedReducers>

export function shamuGraphReducer(state: ShamuGraphState | undefined, action: ShamuGraphAction) {
	switch (action.type) {
		case REPLACE_SHAMU_GRAPH_STATE: return {
			nodes: Object.freeze({
				basicSynthesizers: deserialize(ConnectionNodeType.basicSynthesizer, action.shamuGraphState.nodes.basicSynthesizers),
				basicSamplers: deserialize(ConnectionNodeType.basicSampler, action.shamuGraphState.nodes.basicSamplers),
				gridSequencers: deserialize(ConnectionNodeType.gridSequencer, action.shamuGraphState.nodes.gridSequencers),
				groupSequencers: deserialize(ConnectionNodeType.groupSequencer, action.shamuGraphState.nodes.groupSequencers),
				infiniteSequencers: deserialize(ConnectionNodeType.infiniteSequencer, action.shamuGraphState.nodes.infiniteSequencers),
				simpleReverbs: deserialize(ConnectionNodeType.simpleReverb, action.shamuGraphState.nodes.simpleReverbs),
				simpleCompressors: deserialize(ConnectionNodeType.simpleCompressor, action.shamuGraphState.nodes.simpleCompressors),
				simpleDelays: deserialize(ConnectionNodeType.simpleDelay, action.shamuGraphState.nodes.simpleDelays),
				virtualKeyboards: deserialize(ConnectionNodeType.virtualKeyboard, action.shamuGraphState.nodes.virtualKeyboards),
			}),
			edges: makeShamuEdgesState().merge(action.shamuGraphState.edges),
		}
		// case MERGE_SHAMU_GRAPH_STATE: {
		// 	if (!state) {
		// 		logger.warn('MERGE_SHAMU_GRAPH_STATE - tried to merge with non-existent state')
		// 		return state
		// 	}

		// 	return {
		// 		nodes: Object.freeze({
		// 			basicSynthesizers: {
		// 				...state.nodes.basicSynthesizers,
		// 				...deserialize(ConnectionNodeType.basicSynthesizer, action.shamuGraphState.nodes.basicSynthesizers),
		// 			},
		// 			basicSamplers: {
		// 				...state.nodes.basicSamplers,
		// 				...deserialize(ConnectionNodeType.basicSampler, action.shamuGraphState.nodes.basicSamplers),
		// 			},
		// 			gridSequencers: {
		// 				...state.nodes.gridSequencers,
		// 				...deserialize(ConnectionNodeType.gridSequencer, action.shamuGraphState.nodes.gridSequencers),
		// 			},
		// 			groupSequencers: {
		// 				...state.nodes.groupSequencers,
		// 				...deserialize(ConnectionNodeType.groupSequencer, action.shamuGraphState.nodes.groupSequencers),
		// 			},
		// 			infiniteSequencers: {
		// 				...state.nodes.infiniteSequencers,
		// 				...deserialize(ConnectionNodeType.infiniteSequencer, action.shamuGraphState.nodes.infiniteSequencers),
		// 			},
		// 			simpleReverbs: {
		// 				...state.nodes.simpleReverbs,
		// 				...deserialize(ConnectionNodeType.simpleReverb, action.shamuGraphState.nodes.simpleReverbs),
		// 			},
		// 			simpleCompressors: {
		// 				...state.nodes.simpleCompressors,
		// 				...deserialize(ConnectionNodeType.simpleCompressor, action.shamuGraphState.nodes.simpleCompressors),
		// 			},
		// 			simpleDelays: {
		// 				...state.nodes.simpleDelays,
		// 				...deserialize(ConnectionNodeType.simpleDelay, action.shamuGraphState.nodes.simpleDelays),
		// 			},
		// 			// Don't merge keyboards
		// 			virtualKeyboards: state.nodes.virtualKeyboards,
		// 		}),
		// 		edges: {
		// 			...state.edges,
		// 			...makeShamuEdgesState().merge(action.shamuGraphState.edges),
		// 		},
		// 	}
		// }
		default: return shamuGraphCombinedReducers(state, action)
	}
}

const shamuGraphCombinedReducers = combineReducers({
	nodes: nodesReducer,
	edges: edgesReducer,
})

function deserialize<T extends IMultiState>(type: ConnectionNodeType, multiState: T): T {
	if (!multiState) {
		return Object.freeze({
			things: {},
		}) as T
	}

	return Object.freeze({
		...multiState,
		things: Map(multiState.things)
			.map(getConnectionNodeInfo(type).stateDeserializer)
			.toObject(),
	})
}

export const selectShamuGraphState = (state: IClientRoomState) => state.shamuGraph
