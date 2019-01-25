import {AnyAction} from 'redux'
import {createSelector} from 'reselect'
import * as uuid from 'uuid'
import {applyOctave} from '../../client/music/music-functions'
import {MidiNotes, Octave} from '../../client/music/music-types'
import {addIfNew} from '../../common/server-common'
import {ClientId} from '../common-types'
import {IMidiNote} from '../MidiNote'
import {IClientRoomState} from './common-redux-types'
import {
	addMultiThing, deleteThings, IMultiState, IMultiStateThing,
	IMultiStateThings, makeMultiReducer, MultiThingType, updateThings,
} from './multi-reducer'
import {BROADCASTER_ACTION, NetworkActionType, SERVER_ACTION} from './redux-utils'

export interface VirtualKeyAction {
	type: string
	ownerId: ClientId
	number?: number
	octave?: Octave
	keys?: IMidiNote[]
}

export const ADD_VIRTUAL_KEYBOARD = 'ADD_VIRTUAL_KEYBOARD'
export const addVirtualKeyboard = (virtualKeyboard: IVirtualKeyboardState) =>
	addMultiThing(virtualKeyboard, MultiThingType.virtualKeyboard, NetworkActionType.SERVER_AND_BROADCASTER)

export const DELETE_VIRTUAL_KEYBOARDS = 'DELETE_VIRTUAL_KEYBOARDS'
export const deleteVirtualKeyboards = (virtualKeyboardIds: string[]) =>
	deleteThings(virtualKeyboardIds, MultiThingType.virtualKeyboard, NetworkActionType.SERVER_AND_BROADCASTER)

export const UPDATE_VIRTUAL_KEYBOARDS = 'UPDATE_VIRTUAL_KEYBOARDS'
export const updateVirtualKeyboards = (keyboards: any) =>
	updateThings(keyboards, MultiThingType.virtualKeyboard, NetworkActionType.BROADCASTER)

export const VIRTUAL_KEY_PRESSED = 'VIRTUAL_KEY_PRESSED'
export const virtualKeyPressed = (id: string, number: number, octave: Octave, midiNote: IMidiNote) => {
	return {
		type: VIRTUAL_KEY_PRESSED,
		SERVER_ACTION,
		BROADCASTER_ACTION,
		id,
		number,
		octave,
		midiNote,
	}
}

export const VIRTUAL_KEY_UP = 'VIRTUAL_KEY_UP'
export const virtualKeyUp = (id: string, number: number) => {
	return {
		type: VIRTUAL_KEY_UP,
		SERVER_ACTION,
		BROADCASTER_ACTION,
		id,
		number,
	}
}

export const VIRTUAL_ALL_KEYS_UP = 'VIRTUAL_ALL_KEYS_UP'
export const virtualAllKeysUp = (id: string) => {
	return {
		type: VIRTUAL_ALL_KEYS_UP,
		id,
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
export const virtualOctaveChange = (id: string, delta: number) => {
	return {
		type: VIRTUAL_OCTAVE_CHANGE,
		SERVER_ACTION,
		BROADCASTER_ACTION,
		id,
		delta,
	}
}

export const SET_VIRTUAL_KEYS = 'SET_VIRTUAL_KEYS'
export const setVirtualKeys = (id: string, keys: IMidiNote[]) => {
	return {
		type: SET_VIRTUAL_KEYS,
		id,
		keys,
	}
}

export interface IVirtualKeyboardsState extends IMultiState {
	things: IVirtualKeyboards
}

export interface IVirtualKeyboards extends IMultiStateThings {
	[clientId: string]: IVirtualKeyboardState,
}

export interface IVirtualKeyboardState extends IMultiStateThing {
	pressedKeys: IMidiNote[]
	octave: Octave
	id: string
	ownerId: ClientId
	color: string
}

const emptyArray: any[] = []

export class VirtualKeyboardState implements IVirtualKeyboardState {
	public static dummy: IVirtualKeyboardState = {
		pressedKeys: emptyArray,
		octave: 0,
		id: 'dummy',
		ownerId: 'dummyOwner',
		color: 'gray',
	}

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

const keyboardActionTypes = [
	VIRTUAL_KEY_PRESSED,
	VIRTUAL_KEY_UP,
	VIRTUAL_ALL_KEYS_UP,
	SET_VIRTUAL_KEYS,
	VIRTUAL_OCTAVE,
	VIRTUAL_OCTAVE_CHANGE,
]

export const virtualKeyboardsReducer = makeMultiReducer<IVirtualKeyboardState, IVirtualKeyboardsState>(
	virtualKeyboardReducer, MultiThingType.virtualKeyboard, keyboardActionTypes)

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
			return virtualKeyboard
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

export const selectAllVirtualKeyboards = (state: IClientRoomState) =>
	state.virtualKeyboards.things

export const selectAllVirtualKeyboardsArray = (state: IClientRoomState) => {
	const keyboards = selectAllVirtualKeyboards(state)
	return Object.keys(keyboards).map(x => keyboards[x])
}

export const selectAllVirtualKeyboardIds = createSelector(
	selectAllVirtualKeyboards,
	virtualKeyboards => Object.keys(virtualKeyboards),
)

export const selectVirtualKeyboardById = (state: IClientRoomState, id: string) => {
	return selectAllVirtualKeyboards(state)[id] || VirtualKeyboardState.dummy
}

export const selectVirtualKeyboardIsActive = (state: IClientRoomState, id: string) => {
	return selectVirtualKeyboardById(state, id).pressedKeys.length > 0
}

export const selectVirtualKeyboardIsSending = (state: IClientRoomState, id: string) => {
	return selectVirtualKeyboardById(state, id).pressedKeys.length > 0
}

export const makeGetKeyboardMidiOutput = () => {
	return createSelector(
		selectVirtualKeyboardById,
		keyboard => keyboard === undefined ? [] : keyboard.pressedKeys.map(x => applyOctave(x, keyboard.octave)),
	)
}

export function selectVirtualKeyboardsByOwner(state: IClientRoomState, ownerId: ClientId) {
	return selectAllVirtualKeyboardsArray(state)
		.filter(x => x.ownerId === ownerId)
}

export function selectVirtualKeyboardIdByOwner(state: IClientRoomState, ownerId: ClientId) {
	const keyboard = selectAllVirtualKeyboardsArray(state)
		.find(x => x.ownerId === ownerId)
	return keyboard ? keyboard.id : 'fakeKeyboardId'
}
