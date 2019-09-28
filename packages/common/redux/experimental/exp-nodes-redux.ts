import {Map, Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {IClientRoomState} from '../common-redux-types';

export type ExpParamValue = string | boolean | number

export const expNodesActions = {
	add: (newNode: ExpNodeState) => ({
		type: 'EXP_NODE_ADD' as const,
		isExpNodeAction: true,
		newNode,
	} as const),
	delete: (nodeId: Id) => ({
		type: 'EXP_NODE_DELETE' as const,
		isExpNodeAction: true,
		nodeId,
	} as const),
	replaceAll: (state: ExpNodesState) => ({
		type: 'EXP_NODE_REPLACE_ALL' as const,
		isExpNodeAction: true,
		state,
	} as const),
	paramChange: (nodeId: Id, paramName: string, newValue: ExpParamValue) => ({
		type: 'EXP_NODE_PARAM_CHANGE' as const,
		isExpNodeAction: true,
		nodeId,
		paramName,
		newValue,
	} as const),
} as const

export type ExpNodesAction = ActionType<typeof expNodesActions>

const defaultExpNodeState = {
	id: 'dummyId' as Id,
	type: 'dummy' as ExpNodeType,
	params: Map<Id, ExpParamValue>(),
}

const _makeExpNodeState = Record(defaultExpNodeState)

export function makeExpNodeState(position: Exclude<Partial<typeof defaultExpNodeState>, 'id'>): ExpNodeState {
	return _makeExpNodeState(position).set('id', position.id || uuid.v4())
}

export interface ExpNodeState extends ReturnType<typeof _makeExpNodeState> {}

export type ExpNodeType = 'oscillator' | 'filter' | 'dummy' | 'audioOutput' | 'gain'

const initialState = Map<Id, ExpNodeState>()

export type ExpNodesState = typeof initialState

export const expNodesReducer = (state = initialState, action: ExpNodesAction): ExpNodesState => {
	switch (action.type) {
		case 'EXP_NODE_ADD': return state.set(action.newNode.id, makeExpNodeState(action.newNode))
		case 'EXP_NODE_DELETE': return state.delete(action.nodeId)
		case 'EXP_NODE_REPLACE_ALL': return state.clear().merge(action.state).map(x => makeExpNodeState(x))
		case 'EXP_NODE_PARAM_CHANGE': return state.update(action.nodeId, x => x.update('params', params => params.set(action.paramName, action.newValue)))
		default: return state
	}
}

export const selectExpNodesState = (state: IClientRoomState) => state.expNodes
