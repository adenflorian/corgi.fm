import {ActionType} from 'typesafe-actions'
import {IMidiNote} from '../MidiNote'
import {ConnectionNodeType} from '../common-types'
import {SERVER_ACTION, BROADCASTER_ACTION} from '.'

export type LocalMidiKeyPressAction = ReturnType<typeof localMidiKeyPress>
export const localMidiKeyPress = (midiNote: IMidiNote) => ({
	type: 'LOCAL_MIDI_KEY_PRESS',
	midiNote,
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
	playShortNote: (sourceId: Id, note: IMidiNote) => ({
		type: 'PLAY_SHORT_NOTE',
		sourceId,
		note,
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
	pruneRoom: () => ({
		type: 'PRUNE_ROOM',
	} as const),
	connectKeyboardToNode: (nodeId: Id, targetType: ConnectionNodeType) => ({
		type: 'CONNECT_KEYBOARD_TO_NODE',
		nodeId,
		targetType,
	} as const)
} as const

export type LocalAction = ActionType<typeof localActions>
| LocalMidiKeyPressAction | LocalMidiKeyUpAction
| LocalMidiOctaveChangeAction | WindowBlurAction | DeleteNodeAction
