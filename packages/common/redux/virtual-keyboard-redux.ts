import {Set} from 'immutable'
import {createSelector} from 'reselect'
import * as uuid from 'uuid'
import {ConnectionNodeType, IMultiStateThing, IMultiStateThingDeserializer, Octave} from '../common-types'
import {applyOctave} from '../common-utils'
import {emptyMidiNotes, IMidiNote, IMidiNotes, MidiNotes} from '../MidiNote'
import {NodeSpecialState} from './shamu-graph'
import {addMultiThing, BROADCASTER_ACTION, IClientRoomState, IMultiState, IMultiStateThings, makeMultiReducer, NetworkActionType, SERVER_ACTION} from '.'
import {IClientAppState} from './common-redux-types';

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
export const virtualKeyPressed = (id: Id, number: number, octave: Octave, midiNote: IMidiNote) => {
	return {
		type: VIRTUAL_KEY_PRESSED as typeof VIRTUAL_KEY_PRESSED,
		SERVER_ACTION,
		BROADCASTER_ACTION,
		id,
		number,
		octave,
		midiNote,
	}
}

export const VIRTUAL_KEY_UP = 'VIRTUAL_KEY_UP'
export type VirtualKeyUpAction = ReturnType<typeof virtualKeyUp>
export const virtualKeyUp = (id: Id, number: number) => {
	return {
		type: VIRTUAL_KEY_UP as typeof VIRTUAL_KEY_UP,
		SERVER_ACTION,
		BROADCASTER_ACTION,
		id,
		number,
	}
}

export const VIRTUAL_OCTAVE_CHANGE = 'VIRTUAL_OCTAVE_CHANGE'
export type VirtualOctaveChangeAction = ReturnType<typeof virtualOctaveChange>
export const virtualOctaveChange = (id: Id, delta: number) => {
	return {
		type: VIRTUAL_OCTAVE_CHANGE as typeof VIRTUAL_OCTAVE_CHANGE,
		SERVER_ACTION,
		BROADCASTER_ACTION,
		id,
		delta,
	}
}

export interface IVirtualKeyboardsState extends IMultiState {
	things: IVirtualKeyboards
}

export interface IVirtualKeyboards extends IMultiStateThings {
	[clientId: string]: VirtualKeyboardState
}

export class VirtualKeyboardState implements IMultiStateThing, NodeSpecialState {
	public static defaultWidth = 456
	public static defaultHeight = 56

	public static dummy: VirtualKeyboardState = {
		pressedKeys: emptyMidiNotes,
		octave: 0,
		id: 'dummy',
		ownerId: 'dummyOwner',
		color: 'gray',
		type: ConnectionNodeType.virtualKeyboard,
		width: VirtualKeyboardState.defaultWidth,
		height: VirtualKeyboardState.defaultHeight,
		name: 'Dummy Virtual Keyboard',
		enabled: false,
	}

	public static fromJS: IMultiStateThingDeserializer = state => {
		const x = state as VirtualKeyboardState
		const y: VirtualKeyboardState = {
			...(new VirtualKeyboardState(x.ownerId, x.color)),
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
	public readonly name: string = 'Virtual Keyboard'
	public readonly enabled: boolean = true

	public constructor(
		public readonly ownerId: ClientId,
		public readonly color: string = 'black',
	) {}
}

export type VirtualKeyboardAction = VirtualOctaveChangeAction | VirtualKeyUpAction | VirtualKeyPressedAction

const keyboardActionTypes = [
	VIRTUAL_KEY_PRESSED,
	VIRTUAL_KEY_UP,
	VIRTUAL_OCTAVE_CHANGE,
]

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

export function selectVirtualKeyboardsByOwner(state: IClientRoomState, ownerId: ClientId) {
	return selectAllVirtualKeyboardsArray(state)
		.filter(x => x.ownerId === ownerId)
}

export function selectVirtualKeyboardIdByOwner(state: IClientRoomState, ownerId: ClientId) {
	return selectVirtualKeyboardByOwner(state, ownerId).id
}

export function selectVirtualKeyboardByOwner(state: IClientRoomState, ownerId: ClientId) {
	const keyboard = selectAllVirtualKeyboardsArray(state)
		.find(x => x.ownerId === ownerId)
	return keyboard || VirtualKeyboardState.dummy
}
