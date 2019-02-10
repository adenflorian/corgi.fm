import {Set} from 'immutable'
import {AnyAction} from 'redux'
import {createSelector} from 'reselect'
import * as uuid from 'uuid'
import {applyOctave} from '../../client/music/music-functions'
import {Octave} from '../../client/music/music-types'
import {ClientId, ConnectionNodeType, IMultiStateThing, IMultiStateThingDeserializer} from '../common-types'
import {emptyMidiNotes, IMidiNote, IMidiNotes, MidiNotes} from '../MidiNote'
import {addMultiThing, BROADCASTER_ACTION, deleteThings, IClientRoomState, IMultiState, IMultiStateThings, makeMultiReducer, NetworkActionType, SERVER_ACTION, updateThings} from './index'
import {NodeSpecialState} from './shamu-graph'

export interface VirtualKeyAction {
	type: string
	ownerId: ClientId
	number?: number
	octave?: Octave
	keys?: IMidiNotes
}

export const ADD_VIRTUAL_KEYBOARD = 'ADD_VIRTUAL_KEYBOARD'
export const addVirtualKeyboard = (virtualKeyboard: IVirtualKeyboardState) =>
	addMultiThing(virtualKeyboard, ConnectionNodeType.virtualKeyboard, NetworkActionType.SERVER_AND_BROADCASTER)

export const DELETE_VIRTUAL_KEYBOARDS = 'DELETE_VIRTUAL_KEYBOARDS'
export const deleteVirtualKeyboards = (virtualKeyboardIds: string[]) =>
	deleteThings(virtualKeyboardIds, ConnectionNodeType.virtualKeyboard, NetworkActionType.SERVER_AND_BROADCASTER)

export const UPDATE_VIRTUAL_KEYBOARDS = 'UPDATE_VIRTUAL_KEYBOARDS'
export const updateVirtualKeyboards = (keyboards: any) =>
	updateThings(keyboards, ConnectionNodeType.virtualKeyboard, NetworkActionType.BROADCASTER)

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
export const setVirtualKeys = (id: string, keys: IMidiNotes) => {
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
	pressedKeys: IMidiNotes
	octave: Octave
	id: string
	ownerId: ClientId
	color: string
}

export class VirtualKeyboardState implements IVirtualKeyboardState, NodeSpecialState {
	public static dummy: IVirtualKeyboardState = {
		pressedKeys: emptyMidiNotes,
		octave: 0,
		id: 'dummy',
		ownerId: 'dummyOwner',
		color: 'gray',
		type: ConnectionNodeType.virtualKeyboard,
	}

	public static fromJS: IMultiStateThingDeserializer = state => {
		const x = state as VirtualKeyboardState
		const y = {
			...state,
			pressedKeys: MidiNotes(x.pressedKeys),
		} as VirtualKeyboardState
		return y
	}

	public readonly pressedKeys: IMidiNotes = Set()
	public readonly octave: number = 4
	public readonly id: string = uuid.v4()
	public readonly ownerId: ClientId
	public readonly color: string
	public readonly type = ConnectionNodeType.virtualKeyboard

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
	virtualKeyboardReducer, ConnectionNodeType.virtualKeyboard, keyboardActionTypes)

function virtualKeyboardReducer(virtualKeyboard: IVirtualKeyboardState, action: AnyAction): IVirtualKeyboardState {
	switch (action.type) {
		case VIRTUAL_KEY_PRESSED:
			return {
				...virtualKeyboard,
				pressedKeys: virtualKeyboard.pressedKeys.add(action.number),
			}
		case VIRTUAL_KEY_UP:
			return {
				...virtualKeyboard,
				pressedKeys: virtualKeyboard.pressedKeys.filter(x => x !== action.number),
			}
		case VIRTUAL_ALL_KEYS_UP:
			return {
				...virtualKeyboard,
				pressedKeys: emptyMidiNotes,
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
	notes: IMidiNotes
}

export const selectAllVirtualKeyboards = (state: IClientRoomState) =>
	state.shamuGraph.nodes.virtualKeyboards.things

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
	return selectVirtualKeyboardById(state, id).pressedKeys.count() > 0
}

export const selectVirtualKeyboardIsSending = (state: IClientRoomState, id: string) => {
	return selectVirtualKeyboardById(state, id).pressedKeys.count() > 0
}

export const makeGetKeyboardMidiOutput = () => {
	return createSelector(
		selectVirtualKeyboardById,
		keyboard => keyboard === undefined ? MidiNotes() : keyboard.pressedKeys.map(x => applyOctave(x, keyboard.octave)),
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
