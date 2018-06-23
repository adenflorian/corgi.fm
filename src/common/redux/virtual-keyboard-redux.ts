import {createSelector} from 'reselect'
import {applyOctave} from '../../client/music/music-functions'
import {Octave} from '../../client/music/music-types'
import {ClientId} from '../../client/websocket-listeners'
import {addIfNew} from '../../common/server-common'
import {IMidiNote} from '../MidiNote'
import {CLIENT_DISCONNECTED, NEW_CLIENT, SET_CLIENTS} from './clients-redux'
import {IAppState} from './configureStore'
import {makeBroadcaster} from './redux-utils'
import {SET_MY_CLIENT_ID} from './websocket-redux'

export interface VirtualKeyAction {
	type: string
	ownerId: ClientId
	number?: number
	octave?: Octave
	keys?: IMidiNote[]
}

export const VIRTUAL_KEY_PRESSED = 'VIRTUAL_KEY_PRESSED'
export const virtualKeyPressed = (ownerId: ClientId, number: number) => {
	return {
		type: VIRTUAL_KEY_PRESSED,
		ownerId,
		number,
	}
}

export const VIRTUAL_KEY_UP = 'VIRTUAL_KEY_UP'
export const virtualKeyUp = (ownerId: ClientId, number: number) => {
	return {
		type: VIRTUAL_KEY_UP,
		ownerId,
		number,
	}
}

export const VIRTUAL_ALL_KEYS_UP = 'VIRTUAL_ALL_KEYS_UP'
export const virtualAllKeysUp = (ownerId: ClientId) => {
	return {
		type: VIRTUAL_ALL_KEYS_UP,
		ownerId,
	}
}

export const VIRTUAL_KEY_FLIP = 'VIRTUAL_KEY_FLIP'
export const virtualKeyFlip = (ownerId: ClientId, number: number) => {
	return {
		type: VIRTUAL_KEY_FLIP,
		ownerId,
		number,
	}
}

export const VIRTUAL_OCTAVE = 'VIRTUAL_OCTAVE'
export const virtualOctave = (ownerId: ClientId, octave: Octave) => {
	return {
		type: VIRTUAL_OCTAVE,
		ownerId,
		octave,
	}
}

export const VIRTUAL_OCTAVE_CHANGE = 'VIRTUAL_OCTAVE_CHANGE'
export const virtualOctaveChange = makeBroadcaster((ownerId: ClientId, delta: number) => {
	return {
		type: VIRTUAL_OCTAVE_CHANGE,
		ownerId,
		delta,
	}
})

export const SET_VIRTUAL_KEYS = 'SET_VIRTUAL_KEYS'
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
	id: string
}

const initialState: VirtualKeyboardsState = {
	'track-1': {
		octave: defaultOctave - 1,
		pressedKeys: [],
		id: 'track-123',
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
		case VIRTUAL_ALL_KEYS_UP:
			return {
				...state,
				[action.ownerId]: {
					...state[action.ownerId],
					pressedKeys: [],
				},
			}
		case VIRTUAL_KEY_FLIP:
			return {
				...state,
				[action.ownerId]: {
					...state[action.ownerId],
					pressedKeys: flipKey(
						state[action.ownerId] ? state[action.ownerId].pressedKeys : [],
						action.number,
					),
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
		case VIRTUAL_OCTAVE_CHANGE:
			return {
				...state,
				[action.ownerId]: {
					...state[action.ownerId],
					octave: state[action.ownerId].octave + action.delta,
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
			return {
				...state,
				...action.clients.reduce((all, client) => {
					all[client.id] = {
						octave: client.octave,
						pressedKeys: client.notes,
						id: state[client.id] ? state[client.id].id : -1,
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
					id: action.id,
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

export function flipKey(keys: any[], key: any) {
	if (keys.some(x => x === key)) {
		return keys.filter(x => x !== key)
	} else {
		return [...keys, key]
	}
}

export interface IMidi {
	notes: IMidiNote[]
}

const selectVirtualKeyboardByOwner = (state, {ownerId}) => state.virtualKeyboards[ownerId]

export const makeGetMidiOutputByOwner = () => {
	return createSelector(
		selectVirtualKeyboardByOwner,
		keyboard => keyboard === undefined ? [] : keyboard.pressedKeys.map(x => applyOctave(x, keyboard.octave)),
	)
}

export function selectMidiOutput(state: IAppState, ownerId: ClientId): IMidi {
	const virtualKeyboardState = state.virtualKeyboards[ownerId]

	if (virtualKeyboardState === undefined) return {notes: []}

	return {
		notes: virtualKeyboardState.pressedKeys.map(x => applyOctave(x, virtualKeyboardState.octave)),
	}
}

export function selectKeyboardIdByOwnerId(state: IAppState, ownerId: ClientId) {
	return state.virtualKeyboards[ownerId].id
}
