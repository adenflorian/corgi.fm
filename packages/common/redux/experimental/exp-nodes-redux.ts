import {Map, Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {
	BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION, ExpNodeType,
} from '..'
import {IClientAppState} from '../common-redux-types';

export type ExpParamValue = string | boolean | number

export const expNodesActions = {
	add: (newNode: ExpNodeState) => ({
		type: 'EXP_NODE_ADD' as const,
		isExpNodeAction: true,
		newNode,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	delete: (nodeId: Id) => ({
		type: 'EXP_NODE_DELETE' as const,
		isExpNodeAction: true,
		nodeId,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	replaceAll: (state: ExpNodesState) => ({
		type: 'EXP_NODE_REPLACE_ALL' as const,
		isExpNodeAction: true,
		state,
	} as const),
	paramChange: (nodeId: Id, paramId: Id, newValue: number) => ({
		type: 'EXP_NODE_PARAM_CHANGE' as const,
		isExpNodeAction: true,
		nodeId,
		paramId,
		newValue,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	setEnabled: (nodeId: Id, enabled: boolean) => ({
		type: 'EXP_NODE_SET_ENABLED',
		nodeId,
		enabled,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
} as const

export type ExpNodesAction = ActionType<typeof expNodesActions>

const defaultExpNodeState = {
	id: 'dummyId' as Id,
	type: 'dummy' as ExpNodeType,
	audioParams: Map<Id, number>(),
	enabled: true,
}

const _makeExpNodeState = Record(defaultExpNodeState)

const defaultExpNodeRecord = _makeExpNodeState()

export function makeExpNodeState(node: Exclude<Partial<typeof defaultExpNodeState>, 'id'>): ExpNodeState {
	return _makeExpNodeState(node)
		.set('id', node.id || uuid.v4())
		.set('audioParams', Map(node.audioParams || Map()))
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
		case 'EXP_NODE_PARAM_CHANGE': return state.update(
			action.nodeId, x => x.update('audioParams', audioParams => audioParams.set(action.paramId, action.newValue)))
		case 'EXP_NODE_SET_ENABLED': return state.update(
			action.nodeId, x => x.set('enabled', action.enabled))
		default: return state
	}
}

export const selectExpNodesState = (state: IClientRoomState) => state.expNodes

export const selectExpNode = (state: IClientRoomState, id: Id) =>
	selectExpNodesState(state).get(id) || defaultExpNodeRecord

export const createExpNodeEnabledSelector = (id: Id) => (state: IClientAppState) =>
	selectExpNode(state.room, id).enabled