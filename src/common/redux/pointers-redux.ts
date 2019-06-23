import {List, Map, Record} from 'immutable'
import {combineReducers} from 'redux'
import {ActionType} from 'typesafe-actions'
import {BROADCASTER_ACTION, SERVER_ACTION} from '.'
import {IClientRoomState} from './common-redux-types'

export const ADD_POINTER = 'ADD_POINTER'
export const UPDATE_POINTER = 'UPDATE_POINTER'
export const DELETE_POINTER = 'DELETE_POINTER'
export const REPLACE_ALL_POINTERS = 'REPLACE_ALL_POINTERS'

export const pointerActionTypesWhitelist = List([
	ADD_POINTER,
	UPDATE_POINTER,
])

export const pointersActions = Object.freeze({
	add: (ownerId: string) => ({
		type: ADD_POINTER as typeof ADD_POINTER,
		ownerId,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	update: (ownerId: string, pointer: Partial<Pointer>) => ({
		type: UPDATE_POINTER as typeof UPDATE_POINTER,
		ownerId,
		pointer,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	delete: (ownerId: string) => ({
		type: DELETE_POINTER as typeof DELETE_POINTER,
		ownerId,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	replaceAll: (pointers: Pointers) => ({
		type: REPLACE_ALL_POINTERS as typeof REPLACE_ALL_POINTERS,
		pointers,
	}),
})

export type Pointers = typeof defaultPointers

const defaultPointers = Map<string, Pointer>()

export type Pointer = typeof defaultPointer

const defaultPointer = Object.freeze({
	ownerId: '-1',
	x: 0,
	y: 0,
})

const makePointer = Record(defaultPointer)

export type PointersAction = ActionType<typeof pointersActions>

const _pointersReducer = (state = defaultPointers, action: PointersAction): Pointers => {
	switch (action.type) {
		case ADD_POINTER: return state.set(action.ownerId, makePointer({ownerId: action.ownerId}))
		case UPDATE_POINTER: return state.update(action.ownerId, x => ({...x, ...action.pointer}))
		case DELETE_POINTER: return state.delete(action.ownerId)
		case REPLACE_ALL_POINTERS: return state.clear().merge(action.pointers)
		default: return state
	}
}

export const pointersStateReducer = combineReducers({
	all: _pointersReducer,
})

export const selectPointersState = (state: IClientRoomState) => state.pointers

export const selectAllPointers = (state: IClientRoomState) => state.pointers.all

export const selectPointer = (state: IClientRoomState, ownerId: string) =>
	selectAllPointers(state).get(ownerId) || defaultPointer
