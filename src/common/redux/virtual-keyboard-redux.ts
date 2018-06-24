import {AnyAction} from 'redux'
import {createSelector} from 'reselect'
import * as uuid from 'uuid'
import {applyOctave} from '../../client/music/music-functions'
import {Octave} from '../../client/music/music-types'
import {ClientId} from '../../client/websocket-listeners'
import {addIfNew} from '../../common/server-common'
import {IMidiNote} from '../MidiNote'
import {IAppState} from './configureStore'
import {makeActionCreator, makeBroadcaster, makeServerAction} from './redux-utils'

export interface VirtualKeyAction {
	type: string
	ownerId: ClientId
	number?: number
	octave?: Octave
	keys?: IMidiNote[]
}

export const ADD_VIRTUAL_KEYBOARD = 'ADD_VIRTUAL_KEYBOARD'
export const addVirtualKeyboard = makeServerAction(makeBroadcaster((virtualKeyboard: IVirtualKeyboardState) => ({
	type: ADD_VIRTUAL_KEYBOARD,
	virtualKeyboard,
})))

export const DELETE_VIRTUAL_KEYBOARDS = 'DELETE_VIRTUAL_KEYBOARDS'
export const deleteVirtualKeyboards = makeServerAction(makeBroadcaster((virtualKeyboardIds: string[]) => ({
	type: DELETE_VIRTUAL_KEYBOARDS,
	virtualKeyboardIds,
})))

export const UPDATE_VIRTUAL_KEYBOARDS = 'UPDATE_VIRTUAL_KEYBOARDS'
export const updateVirtualKeyboards = makeBroadcaster(makeActionCreator(
	UPDATE_VIRTUAL_KEYBOARDS, 'keyboards',
))

export const VIRTUAL_KEY_PRESSED = 'VIRTUAL_KEY_PRESSED'
export const virtualKeyPressed = makeServerAction(makeBroadcaster((id: string, number: number) => {
	return {
		type: VIRTUAL_KEY_PRESSED,
		id,
		number,
	}
}))

export const VIRTUAL_KEY_UP = 'VIRTUAL_KEY_UP'
export const virtualKeyUp = makeServerAction(makeBroadcaster((id: string, number: number) => {
	return {
		type: VIRTUAL_KEY_UP,
		id,
		number,
	}
}))

export const VIRTUAL_ALL_KEYS_UP = 'VIRTUAL_ALL_KEYS_UP'
export const virtualAllKeysUp = (id: string) => {
	return {
		type: VIRTUAL_ALL_KEYS_UP,
		id,
	}
}

export const VIRTUAL_KEY_FLIP = 'VIRTUAL_KEY_FLIP'
export const virtualKeyFlip = (id: string, number: number) => {
	return {
		type: VIRTUAL_KEY_FLIP,
		id,
		number,
	}
}

export const VIRTUAL_OCTAVE = 'VIRTUAL_OCTAVE'
export const virtualOctave = (id: string, octave: Octave) => {
	return {
		type: VIRTUAL_OCTAVE,
		id,
		octave,
	}
}

export const VIRTUAL_OCTAVE_CHANGE = 'VIRTUAL_OCTAVE_CHANGE'
export const virtualOctaveChange = makeServerAction(makeBroadcaster((id: string, delta: number) => {
	return {
		type: VIRTUAL_OCTAVE_CHANGE,
		id,
		delta,
	}
}))

export const SET_VIRTUAL_KEYS = 'SET_VIRTUAL_KEYS'
export const setVirtualKeys = (id: string, keys: IMidiNote[]) => {
	return {
		type: SET_VIRTUAL_KEYS,
		id,
		keys,
	}
}

export interface IVirtualKeyboardsState {
	keyboards: IVirtualKeyboards
}

export interface IVirtualKeyboards {
	[clientId: string]: IVirtualKeyboardState,
}

export interface IVirtualKeyboardState {
	pressedKeys: IMidiNote[]
	octave: Octave
	id: string
	ownerId: ClientId
	color: string
}

export class VirtualKeyboardState implements IVirtualKeyboardState {
	public pressedKeys: number[] = []
	public octave: number = 4
	public id: string = uuid.v4()
	public ownerId: ClientId
	public color: string

	constructor(ownerId: ClientId, color: string) {
		this.ownerId = ownerId
		this.color = color
	}
}

const initialState: IVirtualKeyboardsState = createInitialVirtualKeyboardsState()

function createInitialVirtualKeyboardsState() {
	return {
		keyboards: {},
	}
}

export function virtualKeyboardsReducer(
	state: IVirtualKeyboardsState = initialState, action: VirtualKeyAction | any,
): IVirtualKeyboardsState {
	switch (action.type) {
		case ADD_VIRTUAL_KEYBOARD:
			return {
				...state,
				keyboards: {
					...state.keyboards,
					[action.virtualKeyboard.id]: action.virtualKeyboard,
				},
			}
		case DELETE_VIRTUAL_KEYBOARDS:
			const newState = {...state, keyboards: {...state.keyboards}}
			action.virtualKeyboardIds.forEach(x => delete newState.keyboards[x])
			return newState
		case UPDATE_VIRTUAL_KEYBOARDS:
			return {
				...state,
				keyboards: {
					...state.keyboards,
					...action.keyboards,
				},
			}
		case VIRTUAL_KEY_PRESSED:
		case VIRTUAL_KEY_UP:
		case VIRTUAL_ALL_KEYS_UP:
		case VIRTUAL_KEY_FLIP:
		case SET_VIRTUAL_KEYS:
		case VIRTUAL_OCTAVE:
		case VIRTUAL_OCTAVE_CHANGE:
			return {
				...state,
				keyboards: {
					...state.keyboards,
					[action.id]: virtualKeyboardReducer(state.keyboards[action.id], action),
				},
			}
		default:
			return state
	}
}

function virtualKeyboardReducer(virtualKeyboard: IVirtualKeyboardState, action: AnyAction) {
	switch (action.type) {
		case VIRTUAL_KEY_PRESSED:
			return {
				...virtualKeyboard,
				pressedKeys: addIfNew(
					virtualKeyboard.pressedKeys,
					action.number,
				),
			}
		case VIRTUAL_KEY_UP:
			return {
				...virtualKeyboard,
				pressedKeys: virtualKeyboard.pressedKeys.filter(x => x !== action.number),
			}
		case VIRTUAL_ALL_KEYS_UP:
			return {
				...virtualKeyboard,
				pressedKeys: [],
			}
		case VIRTUAL_KEY_FLIP:
			return {
				...virtualKeyboard,
				pressedKeys: flipKey(
					virtualKeyboard.pressedKeys,
					action.number,
				),
			}
		case SET_VIRTUAL_KEYS:
			return {
				...virtualKeyboard,
				pressedKeys: action.keys,
			}
		case VIRTUAL_OCTAVE:
			return {
				...virtualKeyboard,
				octave: action.octave,
			}
		case VIRTUAL_OCTAVE_CHANGE:
			return {
				...virtualKeyboard,
				octave: virtualKeyboard.octave + action.delta,
			}
		default:
			throw new Error('invalid action type')
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

export const selectAllVirtualKeyboards = (state: IAppState) => {
	return state.virtualKeyboards.keyboards
}

export const selectAllVirtualKeyboardsArray = (state: IAppState) => {
	const keyboards = selectAllVirtualKeyboards(state)
	return Object.keys(keyboards).map(x => keyboards[x])
}

export const selectAllVirtualKeyboardIds = (state: IAppState) => {
	return Object.keys(selectAllVirtualKeyboards(state))
}

export const selectVirtualKeyboard = (state: IAppState, id) => {
	return selectAllVirtualKeyboards(state)[id]
}

export const makeGetMidiOutput = () => {
	return createSelector(
		selectVirtualKeyboard,
		keyboard => keyboard === undefined ? [] : keyboard.pressedKeys.map(x => applyOctave(x, keyboard.octave)),
	)
}

export function selectVirtualKeyboardsByOwner(state: IAppState, ownerId: ClientId) {
	return selectAllVirtualKeyboardsArray(state)
		.filter(x => x.ownerId === ownerId)
}
