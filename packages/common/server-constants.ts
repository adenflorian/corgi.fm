import {MidiAction} from './common-types'
import uuid = require('uuid')

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
	buttonPress: (nodeId: Id, buttonId: Id) => ({
		type: 'NODE_TO_NODE_BUTTON_PRESS' as const,
		nodeId,
		buttonId,
		pressId: uuid.v4(),
	} as const),
} as const

export type NodeToNodeAction = ReturnType<typeof nodeToNodeActions[keyof typeof nodeToNodeActions]>
