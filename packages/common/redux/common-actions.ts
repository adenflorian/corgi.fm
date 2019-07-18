export const SELF_DISCONNECTED = 'SELF_DISCONNECTED'
export type SelfDisconnectedAction = ReturnType<typeof selfDisconnected>
export const selfDisconnected = () => ({type: SELF_DISCONNECTED as typeof SELF_DISCONNECTED})

export type ReadyAction = ReturnType<typeof ready>
export const ready = () => ({
	type: 'READY',
} as const)

export type OrganizeGraphAction = ReturnType<typeof organizeGraph>
export const organizeGraph = () => ({
	type: 'ORGANIZE_GRAPH',
} as const)

export type CommonAction = ReadyAction | OrganizeGraphAction
