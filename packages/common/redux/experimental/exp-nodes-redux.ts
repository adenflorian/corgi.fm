import {Set, Map, Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {topGroupId, GroupId} from '../../common-constants'
import {ExpConnectionType} from './exp-connections-redux'
import {
	BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION,
	IClientAppState,
} from '..'

export type ExpParamValue = string | boolean | number

export const expNodesActions = {
	add: (newNode: ExpNodeState) => ({
		type: 'EXP_NODE_ADD' as const,
		isExpNodeAction: true,
		newNode,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	addMany: (newNodes: Map<Id, ExpNodeState>) => ({
		type: 'EXP_NODE_ADD_MANY' as const,
		isExpNodeAction: true,
		newNodes,
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
	deleteMany: (nodeIds: readonly Id[]) => ({
		type: 'EXP_NODE_DELETE_MANY' as const,
		isExpNodeAction: true,
		nodeIds,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	replaceAll: (state: ExpNodesState) => ({
		type: 'EXP_NODE_REPLACE_ALL' as const,
		isExpNodeAction: true,
		state,
	} as const),
	audioParamChange: (nodeId: Id, paramId: Id, newValue: number) => ({
		type: 'EXP_NODE_AUDIO_PARAM_CHANGE' as const,
		isExpNodeAction: true,
		nodeId,
		paramId,
		newValue,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	customNumberParamChange: (nodeId: Id, paramId: Id, newValue: number) => ({
		type: 'EXP_NODE_CUSTOM_NUMBER_PARAM_CHANGE' as const,
		isExpNodeAction: true,
		nodeId,
		paramId,
		newValue,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	customEnumParamChange: (nodeId: Id, paramId: Id, newValue: string) => ({
		type: 'EXP_NODE_CUSTOM_ENUM_PARAM_CHANGE' as const,
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
	setGroup: (nodeIds: Set<Id>, groupId: Id) => ({
		type: 'EXP_NODE_SET_GROUP',
		nodeIds,
		groupId,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	loadPreset: (nodeId: Id, nodePreset: ExpNodeState) => ({
		type: 'EXP_NODE_LOAD_PRESET',
		nodeId,
		nodePreset,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
} as const

export type ExpNodesAction = ActionType<typeof expNodesActions>

const defaultExpNodeState = {
	id: 'dummyId' as Id,
	ownerId: 'dummyOwnerId' as Id,
	type: 'dummy' as ExpNodeType,
	ports: Map<Id, ExpPortState>(),
	audioParams: Map<Id, number>(),
	customNumberParams: Map<Id, number>(),
	customEnumParams: Map<Id, string>(),
	enabled: true,
	groupId: topGroupId as GroupId,
}

const _makeExpNodeState = Record(defaultExpNodeState)

export const defaultExpNodeRecord: ExpNodeState = _makeExpNodeState()

export function makeExpNodeState(node: Partial<typeof defaultExpNodeState>): ExpNodeState {
	return _makeExpNodeState(node)
		.set('id', node.id || uuid.v4())
		.set('audioParams', Map(node.audioParams || Map()))
		.set('customNumberParams', Map(node.customNumberParams || Map()))
		.set('customEnumParams', Map(node.customEnumParams || Map()))
		.set('ports', Map<Id, ExpPortState>(node.ports || Map()).map(makeExpPortState))
}

export interface ExpNodeState extends ReturnType<typeof _makeExpNodeState> {}

export const makeExpPortState = Record({
	id: 'dummyPortId' as Id,
	type: 'dummy' as ExpConnectionType,
	inputOrOutput: 'input' as ExpPortSide,
	isAudioParamInput: false,
})

export interface ExpPortState extends ReturnType<typeof makeExpPortState> {}
export type ExpPortStates = Map<Id, ExpPortState>

export type ExpPortSide = 'input' | 'output'

export type ExpNodeType = typeof expNodeTypes[number]

export const GroupExpNodeType = 'group'

export const PolyphonicGroupExpNodeType = 'polyphonicGroup'

export type GroupType = typeof GroupExpNodeType | typeof PolyphonicGroupExpNodeType

export const expNodeTypes = [
	'oscillator', 'filter', 'dummy', 'audioOutput', 'gain', 'pan', 'envelope',
	'sequencer', 'constant', 'lowFrequencyOscillator', 'midiConverter', 'keyboard',
	'distortion', 'manualPolyphonicMidiConverter', 'automaticPolyphonicMidiConverter',
	GroupExpNodeType, 'groupInput', 'groupOutput',
	PolyphonicGroupExpNodeType, 'polyphonicGroupInput', 'polyphonicGroupOutput',
	'midiRandom', 'midiPitch', 'oscilloscope',
] as const

export const groupInOutNodeTypes: ExpNodeType[] = [
	'groupInput', 'groupOutput',
	'polyphonicGroupInput', 'polyphonicGroupOutput',
]

export const isGroupInOutNode = (node: ExpNodeState) => groupInOutNodeTypes.includes(node.type)

export const isGroupInOutNodeType = (type: ExpNodeType) => groupInOutNodeTypes.includes(type)

const initialState = Map<Id, ExpNodeState>()

export type ExpNodesState = typeof initialState

export const expNodesReducer = (state = initialState, action: ExpNodesAction): ExpNodesState => {
	switch (action.type) {
		case 'EXP_NODE_ADD': return state.set(action.newNode.id, makeExpNodeState(action.newNode))
		case 'EXP_NODE_ADD_MANY': return state.merge(Map(action.newNodes).map(makeExpNodeState))
		case 'EXP_NODE_DELETE': return state.delete(action.nodeId)
		case 'EXP_NODE_DELETE_MANY': return state.deleteAll(action.nodeIds)
		case 'EXP_NODE_REPLACE_ALL': return state.clear().merge(action.state).map(x => makeExpNodeState(x))
		case 'EXP_NODE_AUDIO_PARAM_CHANGE': return state.update(
			action.nodeId, x => x.update('audioParams', audioParams => audioParams.set(action.paramId, action.newValue)))
		case 'EXP_NODE_CUSTOM_NUMBER_PARAM_CHANGE': return state.update(
			action.nodeId, x => x.update('customNumberParams', customNumberParams => customNumberParams.set(action.paramId, action.newValue)))
		case 'EXP_NODE_CUSTOM_ENUM_PARAM_CHANGE': return state.update(
			action.nodeId, x => x.update('customEnumParams', customEnumParams => customEnumParams.set(action.paramId, action.newValue)))
		case 'EXP_NODE_SET_ENABLED': return state.update(
			action.nodeId, x => x.set('enabled', action.enabled))
		case 'EXP_NODE_SET_GROUP': return state.withMutations(mutable => {
			action.nodeIds.forEach(nodeId => {
				mutable.update(nodeId, node => node.set('groupId', action.groupId))
			})
		})
		case 'EXP_NODE_LOAD_PRESET': return state.update(action.nodeId, x => loadPresetIntoNodeState(action.nodePreset, x))
		default: return state
	}
}

export function loadPresetIntoNodeState(preset: ExpNodeState, node: ExpNodeState): ExpNodeState {
	const foo: typeof defaultExpNodeState = {
		// These stay the same
		id: node.id,
		ownerId: node.ownerId,
		type: node.type,
		ports: node.ports,
		enabled: node.enabled,
		groupId: node.groupId,
		// These get loaded from the preset
		audioParams: preset.audioParams,
		customNumberParams: preset.customNumberParams,
		customEnumParams: preset.customEnumParams,
	}
	return makeExpNodeState(foo)
}

export const selectExpNodesState = (state: IClientRoomState): ExpNodesState => state.expGraphs.mainGraph.nodes

export const selectExpNode = (state: IClientRoomState, id: Id): ExpNodeState =>
	selectExpNodesState(state).get(id) || defaultExpNodeRecord

export const createExpNodeEnabledSelector = (id: Id) => (state: IClientAppState) =>
	selectExpNode(state.room, id).enabled
