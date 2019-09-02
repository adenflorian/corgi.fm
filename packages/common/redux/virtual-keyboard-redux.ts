import {Set} from 'immutable'
import {createSelector} from 'reselect'
import * as uuid from 'uuid'
import {
	ConnectionNodeType, IConnectable, IMultiStateThingDeserializer, Octave,
} from '../common-types'
import {applyOctave} from '../common-utils'
import {emptyMidiNotes, IMidiNote, IMidiNotes, MidiNotes} from '../MidiNote'
import {IClientAppState} from './common-redux-types'
import {
	addMultiThing, BROADCASTER_ACTION, IClientRoomState, IMultiState,
	IMultiStateThings, makeMultiReducer, NetworkActionType, SERVER_ACTION,
} from '.'

export interface VirtualKeyAction {
	type: string
	ownerId: ClientId
	number?: number
	octave?: Octave
	keys?: IMidiNotes
}

export const addVirtualKeyboard = (virtualKeyboard: VirtualKeyboardState) =>
	addMultiThing(virtualKeyboard, ConnectionNodeType.virtualKeyboard, NetworkActionType.SERVER_AND_BROADCASTER)

export const VIRTUAL_KEY_PRESSED = 'VIRTUAL_KEY_PRESSED'
export type VirtualKeyPressedAction = ReturnType<typeof virtualKeyPressed>
export const virtualKeyPressed = (id: Id, number: number, midiNote: IMidiNote, velocity: number, targetIds: Set<Id>) => {
	return {
		type: VIRTUAL_KEY_PRESSED,
		SERVER_ACTION,
		BROADCASTER_ACTION,
		id,
		number,
		midiNote,
		velocity,
		targetIds,
	} as const
}

export const VIRTUAL_KEY_UP = 'VIRTUAL_KEY_UP'
export type VirtualKeyUpAction = ReturnType<typeof virtualKeyUp>
export const virtualKeyUp = (id: Id, number: number, midiNote: IMidiNote, targetIds: Set<Id>) => {
	return {
		type: VIRTUAL_KEY_UP,
		SERVER_ACTION,
		BROADCASTER_ACTION,
		id,
		number,
		midiNote,
		targetIds,
	} as const
}

export const VIRTUAL_OCTAVE_CHANGE = 'VIRTUAL_OCTAVE_CHANGE'
export type VirtualOctaveChangeAction = ReturnType<typeof virtualOctaveChange>
export const virtualOctaveChange = (id: Id, delta: number) => {
	return {
		type: VIRTUAL_OCTAVE_CHANGE,
		SERVER_ACTION,
		BROADCASTER_ACTION,
		id,
		delta,
	} as const
}

export interface IVirtualKeyboardsState extends IMultiState {
	things: IVirtualKeyboards
}

export interface IVirtualKeyboards extends IMultiStateThings {
	[clientId: string]: VirtualKeyboardState
}

export class VirtualKeyboardState implements IConnectable {
	public static defaultWidth = 456
	public static defaultHeight = 56

	public static dummy: VirtualKeyboardState = {
		pressedKeys: emptyMidiNotes,
		octave: 0,
		id: 'dummy',
		type: ConnectionNodeType.virtualKeyboard,
		width: VirtualKeyboardState.defaultWidth,
		height: VirtualKeyboardState.defaultHeight,
	}

	public static fromJS: IMultiStateThingDeserializer = state => {
		const x = state as VirtualKeyboardState
		const y: VirtualKeyboardState = {
			...(new VirtualKeyboardState()),
			...(state as VirtualKeyboardState),
			pressedKeys: MidiNotes(x.pressedKeys),
			width: Math.max(x.width, VirtualKeyboardState.defaultWidth),
			height: Math.max(x.height, VirtualKeyboardState.defaultHeight),
		}
		return y
	}

	public readonly pressedKeys: IMidiNotes = Set()
	public readonly octave: number = 4
	public readonly id: Id = uuid.v4()
	public readonly type = ConnectionNodeType.virtualKeyboard
	public readonly width: number = VirtualKeyboardState.defaultWidth
	public readonly height: number = VirtualKeyboardState.defaultHeight
}

export type VirtualKeyboardAction = VirtualOctaveChangeAction | VirtualKeyUpAction | VirtualKeyPressedAction

type KeyboardActionTypes = {
	[key in VirtualKeyboardAction['type']]: 0
}

const keyboardActionTypes2: KeyboardActionTypes = {
	VIRTUAL_KEY_PRESSED: 0,
	VIRTUAL_KEY_UP: 0,
	VIRTUAL_OCTAVE_CHANGE: 0,
}

const keyboardActionTypes = Object.keys(keyboardActionTypes2)

export const virtualKeyboardsReducer = makeMultiReducer<VirtualKeyboardState, IVirtualKeyboardsState>(
	virtualKeyboardReducer, ConnectionNodeType.virtualKeyboard, keyboardActionTypes)

function virtualKeyboardReducer(virtualKeyboard: VirtualKeyboardState, action: VirtualKeyboardAction): VirtualKeyboardState {
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
		case VIRTUAL_OCTAVE_CHANGE:
			return {
				...virtualKeyboard,
				octave: Math.max(-10, Math.min(20, virtualKeyboard.octave + action.delta)),
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

export const selectVirtualKeyboardById = (state: IClientRoomState, id: Id) => {
	return selectAllVirtualKeyboards(state)[id as string] || VirtualKeyboardState.dummy
}

export function selectVirtualKeyboardOctave(id: Id) {
	return (state: IClientAppState) =>
		selectVirtualKeyboardById(state.room, id).octave
}

export const selectVirtualKeyboardHasPressedKeys = (state: IClientRoomState, id: Id) => {
	return selectVirtualKeyboardById(state, id).pressedKeys.count() > 0
}

export const makeGetKeyboardMidiOutput = () => {
	return createSelector(
		selectVirtualKeyboardById,
		keyboard => keyboard === undefined ? MidiNotes() : keyboard.pressedKeys.map(x => applyOctave(x, keyboard.octave)),
	)
}
