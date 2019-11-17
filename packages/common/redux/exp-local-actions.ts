import {ActionType} from 'typesafe-actions'
import {Set} from 'immutable'

export const expLocalActions = {
	createGroup: (nodeIds: Set<Id>) => ({
		type: 'EXP_CREATE_GROUP',
		nodeIds,
	} as const),
	createPreset: (nodeId: Id) => ({
		type: 'EXP_CREATE_PRESET',
		nodeId,
	} as const),
} as const

export type ExpLocalAction = ActionType<typeof expLocalActions>
