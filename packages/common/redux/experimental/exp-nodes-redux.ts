import * as Immutable from 'immutable'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {topGroupId, GroupId} from '../../common-constants'
import {ExpConnectionType} from './exp-connections-redux'
import {
	BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION,
	IClientAppState,
} from '..'
import {selectExpGraphsState} from './exp-common-redux'

export type ExpParamValue = string | boolean | number

export const expNodesActions = {
	add: (newNode: ExpNodeState) => ({
		type: 'EXP_NODE_ADD' as const,
		isExpNodeAction: true,
		newNode,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	addMany: (newNodes: Immutable.Map<Id, ExpNodeState>) => ({
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
	customSetParamChange: (nodeId: Id, paramId: Id, newValue: Immutable.Set<unknown>) => ({
		type: 'EXP_NODE_CUSTOM_SET_PARAM_CHANGE' as const,
		isExpNodeAction: true,
		nodeId,
		paramId,
		newValue,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	customStringParamChange: (nodeId: Id, paramId: Id, newValue: string) => ({
		type: 'EXP_NODE_CUSTOM_STRING_PARAM_CHANGE' as const,
		isExpNodeAction: true,
		nodeId,
		paramId,
		newValue,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	referenceParamChange: (nodeId: Id, paramId: Id, newValue: ExpReferenceParamState) => ({
		type: 'EXP_NODE_REFERENCE_PARAM_CHANGE' as const,
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
	setGroup: (nodeIds: Immutable.Set<Id>, groupId: Id) => ({
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

export type ExpNodePolyMode = 'mono' | 'autoPoly'

const defaultExpNodeState = {
	id: 'dummyId' as Id,
	ownerId: 'dummyOwnerId' as Id,
	type: 'dummy' as ExpNodeType,
	ports: Immutable.Map<Id, ExpPortState>(),
	audioParams: Immutable.Map<Id, number>(),
	customNumberParams: Immutable.Map<Id, number>(),
	customEnumParams: Immutable.Map<Id, string>(),
	customSetParams: Immutable.Map<Id, Immutable.Set<unknown>>(),
	customStringParams: Immutable.Map<Id, string>(),
	referenceParams: Immutable.Map<Id, ExpReferenceParamState>(),
	enabled: true,
	groupId: topGroupId as GroupId,
}

const _makeExpNodeState = Immutable.Record(defaultExpNodeState)

export const defaultExpNodeRecord: ExpNodeState = _makeExpNodeState()

export function makeExpNodeState(node: Pick<typeof defaultExpNodeState, 'groupId' | 'type'> & Partial<typeof defaultExpNodeState>): ExpNodeState {
	return _makeExpNodeState(node)
		.set('id', node.id || uuid.v4())
		.set('audioParams', Immutable.Map(node.audioParams || Immutable.Map()))
		.set('customNumberParams', Immutable.Map(node.customNumberParams || Immutable.Map()))
		.set('customEnumParams', Immutable.Map(node.customEnumParams || Immutable.Map()))
		.set('customSetParams', Immutable.Map<Id, Immutable.Set<unknown>>(node.customSetParams || Immutable.Map()).map(Immutable.Set))
		.set('customStringParams', Immutable.Map(node.customStringParams || Immutable.Map()))
		.set('referenceParams', Immutable.Map(node.referenceParams || Immutable.Map()))
		.set('ports', Immutable.Map<Id, ExpPortState>(node.ports || Immutable.Map()).map(makeExpPortState))
}

export interface ExpNodeState extends ReturnType<typeof _makeExpNodeState> {}

export const makeExpPortState = Immutable.Record({
	id: 'dummyPortId' as Id,
	type: 'dummy' as ExpConnectionType,
	inputOrOutput: 'input' as ExpPortSide,
	isAudioParamInput: false,
})

export interface ExpPortState extends ReturnType<typeof makeExpPortState> {}
export type ExpPortStates = Immutable.Map<Id, ExpPortState>

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
	'midiRandom', 'midiPitch', 'oscilloscope', 'polyTest', 'waveShaper', 'midiGate',
	'midiPulse', 'midiMatch', 'midiMessage', 'sampler', 'betterSequencer',
	'note', 'basicSynth',
] as const

export const groupInOutNodeTypes: ExpNodeType[] = [
	'groupInput', 'groupOutput',
	'polyphonicGroupInput', 'polyphonicGroupOutput',
]

export const groupNodeTypes: ExpNodeType[] = [
	GroupExpNodeType, PolyphonicGroupExpNodeType,
]

export const isGroupNode = (node: ExpNodeState) => groupNodeTypes.includes(node.type)

export const isGroupNodeType = (type: ExpNodeType) => groupNodeTypes.includes(type)

export const isGroupInOutNode = (node: ExpNodeState) => groupInOutNodeTypes.includes(node.type)

export const isGroupInOutNodeType = (type: ExpNodeType) => groupInOutNodeTypes.includes(type)

export interface ExpReferenceParamState {
	readonly targetId: Id
	readonly targetType: ExpReferenceTargetType
}

export type ExpReferenceTargetType = 'midiPattern' | 'midiPatternView' | 'keyboardState'

const initialState = Immutable.Map<Id, ExpNodeState>()

export type ExpNodesState = typeof initialState

export const expNodesReducer = (state = initialState, action: ExpNodesAction): ExpNodesState => {
	switch (action.type) {
		case 'EXP_NODE_ADD': return state.set(action.newNode.id, makeExpNodeState(action.newNode))
		case 'EXP_NODE_ADD_MANY': return state.merge(Immutable.Map(action.newNodes).map(makeExpNodeState))
		case 'EXP_NODE_DELETE': return state.delete(action.nodeId)
		case 'EXP_NODE_DELETE_MANY': return state.deleteAll(action.nodeIds)
		case 'EXP_NODE_AUDIO_PARAM_CHANGE': return state.update(
			action.nodeId, x => x.update('audioParams', audioParams => audioParams.set(action.paramId, action.newValue)))
		case 'EXP_NODE_CUSTOM_NUMBER_PARAM_CHANGE': return state.update(
			action.nodeId, x => x.update('customNumberParams', customNumberParams => customNumberParams.set(action.paramId, action.newValue)))
		case 'EXP_NODE_CUSTOM_ENUM_PARAM_CHANGE': return state.update(
			action.nodeId, x => x.update('customEnumParams', customEnumParams => customEnumParams.set(action.paramId, action.newValue)))
		case 'EXP_NODE_CUSTOM_SET_PARAM_CHANGE': return state.update(
			action.nodeId, x => x.update('customSetParams', customSetParams => customSetParams.set(action.paramId, action.newValue)))
		case 'EXP_NODE_CUSTOM_STRING_PARAM_CHANGE': return state.update(
			action.nodeId, x => x.update('customStringParams', customStringParams => customStringParams.set(action.paramId, action.newValue)))
		case 'EXP_NODE_REFERENCE_PARAM_CHANGE': return state.update(
			action.nodeId, x => x.update('referenceParams', referenceParams => referenceParams.set(action.paramId, action.newValue)))
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
		customSetParams: preset.customSetParams,
		customStringParams: preset.customStringParams,
		referenceParams: preset.referenceParams,
	}
	return makeExpNodeState(foo)
}

export const selectExpNodesState = (state: IClientRoomState): ExpNodesState => selectExpGraphsState(state).mainGraph.nodes

export const selectExpNode = (state: IClientRoomState, id: Id): ExpNodeState =>
	selectExpNodesState(state).get(id) || defaultExpNodeRecord

export const createExpNodeEnabledSelector = (id: Id) => (state: IClientAppState) =>
	selectExpNode(state.room, id).enabled
