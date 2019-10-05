import {ActionType} from 'typesafe-actions'
import {IMidiNote, IMidiNotes} from '../MidiNote'
import {ConnectionNodeType} from '../common-types'
import {SERVER_ACTION, BROADCASTER_ACTION, ActiveGhostConnectorSourceOrTarget} from '.'

export type LocalMidiKeyPressAction = ReturnType<typeof localMidiKeyPress>
export const localMidiKeyPress = (midiNote: IMidiNote, velocity: number) => ({
	type: 'LOCAL_MIDI_KEY_PRESS',
	midiNote,
	velocity,
} as const)

export type LocalMidiKeyUpAction = ReturnType<typeof localMidiKeyUp>
export const localMidiKeyUp = (midiNote: IMidiNote) => ({
	type: 'LOCAL_MIDI_KEY_UP',
	midiNote,
} as const)

export type LocalMidiOctaveChangeAction =
	ReturnType<typeof localMidiOctaveChange>
export const localMidiOctaveChange = (delta: number) => ({
	type: 'LOCAL_MIDI_OCTAVE_CHANGE',
	delta,
} as const)

export type WindowBlurAction = ReturnType<typeof windowBlur>
export const windowBlur = () => ({
	type: 'WINDOW_BLUR',
} as const)

export type DeleteNodeAction = ReturnType<typeof deleteNode>
export const deleteNode = (nodeId: Id) => ({
	type: 'DELETE_NODE',
	nodeId,
} as const)

export const localActions = {
	saveRoomToBrowser: () => ({
		type: 'SAVE_ROOM_TO_BROWSER',
	} as const),
	saveRoomToFile: () => ({
		type: 'SAVE_ROOM_TO_FILE',
	} as const),
	deleteSavedRoom: (id: Id) => ({
		type: 'DELETE_SAVED_ROOM',
		id,
	} as const),
	playShortNote: (sourceId: Id, notes: IMidiNotes) => ({
		type: 'PLAY_SHORT_NOTE',
		sourceId,
		notes,
	} as const),
	playShortNoteOnTarget: (targetId: Id, note: IMidiNote) => ({
		type: 'PLAY_SHORT_NOTE_ON_TARGET',
		targetId,
		note,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	cloneNode: (
		nodeId: Id,
		nodeType: ConnectionNodeType,
		withConnections: 'none' | 'all' | 'default'
	) => ({
		type: 'CLONE_NODE',
		nodeId,
		nodeType,
		withConnections,
	} as const),
	cloneExpNode: (
		nodeId: Id,
		withConnections: 'none' | 'all' | 'default'
	) => ({
		type: 'CLONE_EXP_NODE',
		nodeId,
		withConnections,
	} as const),
	pruneRoom: () => ({
		type: 'PRUNE_ROOM',
	} as const),
	connectKeyboardToNode: (nodeId: Id, targetType: ConnectionNodeType) => ({
		type: 'CONNECT_KEYBOARD_TO_NODE',
		nodeId,
		targetType,
	} as const),
	mouseUpOnPlaceholder: (nodeId: Id, side: ActiveGhostConnectorSourceOrTarget, portId: number) => ({
		type: 'MOUSE_UP_ON_PLACEHOLDER' as const,
		nodeId,
		side,
		portId,
	} as const),
	mouseUpOnExpPlaceholder: (nodeId: Id, side: ActiveGhostConnectorSourceOrTarget, portId: Id) => ({
		type: 'MOUSE_UP_ON_EXP_PLACEHOLDER' as const,
		nodeId,
		side,
		portId,
	} as const),
	deleteExpNode: (nodeId: Id) => ({
		type: 'DELETE_EXP_NODE' as const,
		nodeId,
	} as const),
} as const

export type LocalAction = ActionType<typeof localActions>
| LocalMidiKeyPressAction | LocalMidiKeyUpAction
| LocalMidiOctaveChangeAction | WindowBlurAction | DeleteNodeAction
