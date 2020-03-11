import {ActionType} from 'typesafe-actions'

export const commonActions = {
	selfDisconnected: () => ({
		type: 'SELF_DISCONNECTED' as const,
	} as const),
	ready: () => ({
		type: 'READY' as const,
	} as const),
	notReady: () => ({
		type: 'NOT_READY' as const,
	} as const),
	organizeGraph: () => ({
		type: 'ORGANIZE_GRAPH' as const,
	} as const),
	init: () => ({
		type: '$$$$INIT' as const,
	} as const),
} as const

export type CommonAction = ActionType<typeof commonActions>

export type InitAction = ReturnType<typeof commonActions.init>
