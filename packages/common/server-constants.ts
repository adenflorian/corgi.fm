import {MidiAction} from './common-types'

export enum WebSocketEvent {
	broadcast = 'broadcast',
	serverAction = 'serverAction',
	nodeToNode = 'nodeToNode',
}

export const nodeToNodeActions = {
	midi: (nodeId: Id, midiAction: MidiAction) => ({
		type: 'NODE_TO_NODE_MIDI' as const,
		nodeId,
		midiAction,
	} as const),
} as const

export type NodeToNodeAction = ReturnType<typeof nodeToNodeActions[keyof typeof nodeToNodeActions]>
