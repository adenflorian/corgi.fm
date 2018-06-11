import {IMidiNote} from '../MidiNote'
import {applyOctave} from '../music-functions'
import {Octave} from '../music-types'
import {ClientId} from '../websocket'
import {CLIENT_DISCONNECTED, NEW_CLIENT, SET_CLIENTS} from './clients-redux'
import {IAppState} from './configureStore'
import {SET_MY_CLIENT_ID} from './websocket-redux'

export const VIRTUAL_KEY_PRESSED = 'VIRTUAL_KEY_PRESSED'
export const VIRTUAL_KEY_UP = 'VIRTUAL_KEY_UP'
export const VIRTUAL_OCTAVE = 'VIRTUAL_OCTAVE'
export const INCREASE_VIRTUAL_OCTAVE = 'INCREASE_VIRTUAL_OCTAVE'
export const DECREASE_VIRTUAL_OCTAVE = 'DECREASE_VIRTUAL_OCTAVE'
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
		type: VIRTUAL_OCTAVE,
		ownerId,
		octave,
	}
}

export const increaseVirtualOctave = (ownerId: ClientId) => {
	return {
		type: INCREASE_VIRTUAL_OCTAVE,
		ownerId,
	}
}

export const decreaseVirtualOctave = (ownerId: ClientId) => {
	return {
		type: DECREASE_VIRTUAL_OCTAVE,
		ownerId,
	}
}

export const setVirtualKeys = (ownerId: ClientId, keys: IMidiNote[]) => {
	return {
		type: SET_VIRTUAL_KEYS,
		ownerId,
		keys,
	}
}

const defaultOctave = 4

export interface VirtualKeyboardsState {
	[clientId: string]: VirtualKeyboardState
}

export interface VirtualKeyboardState {
	pressedKeys: IMidiNote[]
	octave: Octave
}

const initialState: VirtualKeyboardsState = {
	'track-1': {
		octave: defaultOctave,
		pressedKeys: [],
	},
}

export function virtualKeyboardsReducer(state: VirtualKeyboardsState = initialState, action: VirtualKeyAction | any) {
	switch (action.type) {
		case VIRTUAL_KEY_PRESSED:
			return {
				...state,
				[action.ownerId]: {
					...state[action.ownerId],
					pressedKeys: addIfNew(
						state[action.ownerId] ? state[action.ownerId].pressedKeys : [],
						action.number,
					),
				},
			}
		case VIRTUAL_KEY_UP:
			return {
				...state,
				[action.ownerId]: {
					...state[action.ownerId],
					pressedKeys: state[action.ownerId].pressedKeys.filter(x => x !== action.number),
				},
			}
		case SET_VIRTUAL_KEYS:
			return {
				...state,
				[action.ownerId]: {
					...state[action.ownerId],
					pressedKeys: action.keys,
				},
			}
		case VIRTUAL_OCTAVE:
			return {
				...state,
				[action.ownerId]: {
					...state[action.ownerId],
					octave: action.octave,
				},
			}
		case INCREASE_VIRTUAL_OCTAVE:
			return {
				...state,
				[action.ownerId]: {
					...state[action.ownerId],
					octave: state[action.ownerId].octave + 1,
				},
			}
		case DECREASE_VIRTUAL_OCTAVE:
			return {
				...state,
				[action.ownerId]: {
					...state[action.ownerId],
					octave: state[action.ownerId].octave - 1,
				},
			}
		case NEW_CLIENT:
			return {
				...state,
				[action.id]: {
					octave: defaultOctave,
					pressedKeys: [],
				},
			}
		case SET_CLIENTS:
			action.clients.reduce((all, client) => {
				all[client.id] = {
					octave: client.octave,
					pressedKeys: client.notes,
				}
				return all
			}, {})
			return {
				...state,
				...action.clients.reduce((all, client) => {
					all[client.id] = {
						octave: client.octave,
						pressedKeys: client.notes,
					}
					return all
				}, {}),
			}
		case SET_MY_CLIENT_ID:
			return {
				...state,
				[action.id]: {
					octave: defaultOctave,
					pressedKeys: [],
				},
			}
		case CLIENT_DISCONNECTED:
			const newState = {...state}
			delete newState[action.id]
			return newState
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

export interface IMidi {
	notes: IMidiNote[]
}

export function selectMidiOutput(state: IAppState, ownerId: ClientId): IMidi {
	const virtualKeyboardState = state.virtualKeyboards[ownerId]

	if (virtualKeyboardState === undefined) return {notes: []}

	return {
		notes: virtualKeyboardState.pressedKeys.map(x => applyOctave(x, virtualKeyboardState.octave)),
	}
}
