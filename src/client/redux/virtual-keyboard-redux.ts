import {IMidiNote} from '../MidiNote'
import {ClientId} from '../websocket'
import {Octave} from './midi-redux'

export const VIRTUAL_KEY_PRESSED = 'VIRTUAL_KEY_PRESSED'
export const VIRTUAL_KEY_UP = 'VIRTUAL_KEY_UP'
export const VIRTUAL_OCTAVE = 'VIRTUAL_OCTAVE'
export const SET_VIRTUAL_KEYS = 'SET_VIRTUAL_KEYS'

export interface VirtualKeyAction {
	type: string
	ownerId: ClientId
	number?: number
	octave?: Octave
	keys?: IMidiNote[]
}

export const virtualKeyPressed = (ownerId: ClientId, number: number) => {
	return {
		type: VIRTUAL_KEY_PRESSED,
		ownerId,
		number,
	}
}

export const virtualKeyUp = (ownerId: ClientId, number: number) => {
	return {
		type: VIRTUAL_KEY_UP,
		ownerId,
		number,
	}
}

export const virtualOctave = (ownerId: ClientId, octave: Octave) => {
	return {
		type: VIRTUAL_KEY_UP,
		ownerId,
		octave,
	}
}

export const setVirtualKeys = (ownerId: ClientId, keys: IMidiNote[]) => {
	return {
		type: SET_VIRTUAL_KEYS,
		ownerId,
		keys,
	}
}

export interface VirtualKeyboardState {
	[clientId: string]: {
		pressedKeys: IMidiNote[],
		octave: Octave,
	}
}

const defaultOctave = 4

export function virtualKeyboardsReducer(state: VirtualKeyboardState = {}, action: VirtualKeyAction) {
	switch (action.type) {
		case VIRTUAL_KEY_PRESSED:
			return {
				...state,
				[action.ownerId]: {
					pressedKeys: addIfNew(state[action.ownerId] ? state[action.ownerId].pressedKeys : [], action.number),
				},
			}
		case VIRTUAL_KEY_UP:
			return {
				...state,
				[action.ownerId]: {
					pressedKeys: state[action.ownerId].pressedKeys.filter(x => x !== action.number),
				},
			}
		case SET_VIRTUAL_KEYS:
			return {
				...state,
				[action.ownerId]: {
					pressedKeys: action.keys,
				},
			}
		case VIRTUAL_OCTAVE:
			return {
				...state,
				[action.ownerId]: {
					octave: action.octave || defaultOctave,
				},
			}
		default:
			return state
	}
}

export function addIfNew(arr: any[], newElement: any) {
	if (arr.some(x => x === newElement)) {
		return arr
	} else {
		return [...arr, newElement]
	}
}

export function selectPressedNotes(notes) {
	return Object.keys(notes).filter(key => notes[key] === true)
}
