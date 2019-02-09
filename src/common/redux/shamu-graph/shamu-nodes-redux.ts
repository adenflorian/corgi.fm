import {Map} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {ConnectionNodeType} from '../../common-types'
import {
	BasicSamplerState, BasicSynthesizerState, GridSequencerState,
	InfiniteSequencerState, IPosition, makePosition, VirtualKeyboardState,
} from '../index'

export const ADD_SHAMU_NODE = 'ADD_SHAMU_NODE'
export const DELETE_SHAMU_NODES = 'DELETE_SHAMU_NODES'
export const UPDATE_SHAMU_NODES = 'UPDATE_SHAMU_NODES'

export const shamuNodesActions = Object.freeze({
	add: (newNode: NodeState) => ({
		type: ADD_SHAMU_NODE as typeof ADD_SHAMU_NODE,
		newNode,
	}),
	delete: (ids: string[]) => ({
		type: DELETE_SHAMU_NODES as typeof DELETE_SHAMU_NODES,
		ids,
	}),
	update: (nodes: ShamuNodesState) => ({
		type: UPDATE_SHAMU_NODES as typeof UPDATE_SHAMU_NODES,
		nodes,
	}),
})

export type ShamuNodesState = typeof initialState

const initialState = Map<string, NodeState>()

interface NodeState {
	id: string
	type: ConnectionNodeType
	position: IPosition
	ownerId: string
	specialData: NodeSpecialState
}

export function makeNodeState({ownerId, type, specialData}: Pick<NodeState, 'ownerId' | 'type' | 'specialData'>) {
	const id = '-1'

	return Object.freeze({
		id,
		ownerId,
		type,
		specialData,
		position: makePosition({
			id,
			targetType: type,
		}),
	})
}

export type NodeSpecialState = BasicSynthesizerState | BasicSamplerState |
	VirtualKeyboardState | GridSequencerState | InfiniteSequencerState

export type ShamuNodesAction = ActionType<typeof shamuNodesActions>

export function nodesReducer(state = initialState, action: ShamuNodesAction) {
	switch (action.type) {
		case ADD_SHAMU_NODE: return state.set(action.newNode.id, action.newNode)
		case DELETE_SHAMU_NODES: return state.deleteAll(action.ids)
		case UPDATE_SHAMU_NODES: return state.merge(action.nodes)
		default: return state
	}
}
