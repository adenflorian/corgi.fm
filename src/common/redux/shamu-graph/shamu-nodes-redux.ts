import {Map} from 'immutable'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {ConnectionNodeType} from '../../common-types'
import {
	BasicSamplerState, BasicSynthesizerState, GridSequencerState,
	InfiniteSequencerState, IPosition, makePosition, VirtualKeyboardState,
} from '../index'

export const ADD_SHAMU_NODE = 'ADD_SHAMU_NODE'
export const DELETE_SHAMU_NODES = 'DELETE_SHAMU_NODES'
export const UPDATE_SHAMU_NODES = 'UPDATE_SHAMU_NODES'
export const SET_ALL_SHAMU_NODES = 'SET_ALL_SHAMU_NODES'

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
	setAll: (nodes: ShamuNodesState) => ({
		type: SET_ALL_SHAMU_NODES as typeof SET_ALL_SHAMU_NODES,
		nodes,
	}),
})

export type ShamuNodesState = ReturnType<typeof makeShamuNodesState>

export function makeShamuNodesState() {
	return Map<string, NodeState>()
}

export interface NodeState {
	id: string
	type: ConnectionNodeType
	position: IPosition
	ownerId: string
	specialState: NodeSpecialState
}

export function makeNodeState({ownerId, type, specialState}: Pick<NodeState, 'ownerId' | 'type' | 'specialState'>) {
	const id = uuid.v4()

	return Object.freeze({
		id,
		ownerId,
		type,
		specialState,
		position: makePosition({
			id, // TODO Is this still needed?
			targetType: type, // TODO Is this still needed?
		}),
	})
}

export type NodeSpecialState = BasicSynthesizerState | BasicSamplerState |
	VirtualKeyboardState | GridSequencerState | InfiniteSequencerState

export type ShamuNodesAction = ActionType<typeof shamuNodesActions>

export function nodesReducer(state = makeShamuNodesState(), action: ShamuNodesAction) {
	switch (action.type) {
		case ADD_SHAMU_NODE: return state.set(action.newNode.id, action.newNode)
		case DELETE_SHAMU_NODES: return state.deleteAll(action.ids)
		case UPDATE_SHAMU_NODES: return state.merge(action.nodes)
		case SET_ALL_SHAMU_NODES: return state.clear().merge(action.nodes)
		default: return state
	}
}
