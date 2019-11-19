import {ActionType} from 'typesafe-actions'
import {Set} from 'immutable'
import {GroupType} from './experimental'

export const expLocalActions = {
	createGroup: (nodeIds: Set<Id>, groupType: GroupType) => ({
		type: 'EXP_CREATE_GROUP',
		nodeIds,
		groupType,
	} as const),
	createPreset: (nodeId: Id) => ({
		type: 'EXP_CREATE_PRESET',
		nodeId,
	} as const),
	createNodeFromPreset: (presetId: Id, position: Point) => ({
		type: 'EXP_CREATE_NODE_FROM_PRESET',
		presetId,
		position,
	} as const),
} as const

export type ExpLocalAction = ActionType<typeof expLocalActions>
