export const SELF_DISCONNECTED = 'SELF_DISCONNECTED'
export type SelfDisconnectedAction = ReturnType<typeof selfDisconnected>
export const selfDisconnected = () => ({type: SELF_DISCONNECTED as typeof SELF_DISCONNECTED})

export const READY = 'READY'
export type ReadyAction = ReturnType<typeof ready>
export const ready = () => ({
	type: READY as typeof READY,
})

export const ORGANIZE_GRAPH = 'ORGANIZE_GRAPH'
export type OrganizeGraphAction = ReturnType<typeof organizeGraph>
export const organizeGraph = () => ({
	type: ORGANIZE_GRAPH as typeof ORGANIZE_GRAPH,
})
