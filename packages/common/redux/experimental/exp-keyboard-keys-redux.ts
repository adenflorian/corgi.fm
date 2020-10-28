import {Set, Map, Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {
	BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION,
} from '..'
import {selectExpProjectState} from '.'

export const expKeyboardsActions = {
	add: (newKeyboard: ExpKeyboardState) => ({
		type: 'EXP_MIDI_KEYBOARD_ADD' as const,
		isExpKeyboardsAction: true,
		newKeyboard,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	delete: (id: Id) => ({
		type: 'EXP_MIDI_KEYBOARD_DELETE' as const,
		isExpKeyboardsAction: true,
		id,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	keysDown: (id: Id, keys: Set<number>) => ({
		type: 'EXP_MIDI_KEYBOARD_KEYS_DOWN',
		id,
		keys,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	keysUp: (id: Id, keys: Set<number>) => ({
		type: 'EXP_MIDI_KEYBOARD_KEYS_UP',
		id,
		keys,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
} as const

export type ExpKeyboardsAction = ActionType<typeof expKeyboardsActions>

const defaultExpKeyboardState = {
	id: 'dummyId',
	pressedKeys: Set<number>(),
}

const _makeExpKeyboardState = Record(defaultExpKeyboardState)

export const defaultExpKeyboardKeysRecord: ExpKeyboardState = _makeExpKeyboardState()

export function makeExpKeyboardState(keyboard: Partial<typeof defaultExpKeyboardState>): ExpKeyboardState {
	return _makeExpKeyboardState(keyboard)
		.set('id', keyboard.id || uuid.v4())
		.set('pressedKeys', Set<number>(keyboard.pressedKeys || []))
}

export interface ExpKeyboardState extends ReturnType<typeof _makeExpKeyboardState> {}

export type ExpKeyboardStateRaw = typeof defaultExpKeyboardState

const initialState = Map<Id, ExpKeyboardState>()

export type ExpKeyboardsState = typeof initialState

export const expKeyboardsReducer = (state = initialState, action: ExpKeyboardsAction): ExpKeyboardsState => {
	switch (action.type) {
		case 'EXP_MIDI_KEYBOARD_ADD':
			return state.set(action.newKeyboard.id, makeExpKeyboardState(action.newKeyboard))
		case 'EXP_MIDI_KEYBOARD_DELETE':
			return state.delete(action.id)
		case 'EXP_MIDI_KEYBOARD_KEYS_DOWN':
			return state.update(action.id, defaultExpKeyboardKeysRecord,
				x => x.update('pressedKeys', x => x.merge(action.keys)))
		case 'EXP_MIDI_KEYBOARD_KEYS_UP':
			return state.update(action.id, defaultExpKeyboardKeysRecord,
				x => x.update('pressedKeys', x => x.subtract(action.keys)))
		default: return state
	}
}

export const selectExpKeyboardState = (state: IClientRoomState): ExpKeyboardsState =>
	selectExpProjectState(state).state.keyboards

export const selectExpKeyboardKeys = (state: IClientRoomState, id: Id): ExpKeyboardState =>
	selectExpKeyboardState(state).get(id) || defaultExpKeyboardKeysRecord
