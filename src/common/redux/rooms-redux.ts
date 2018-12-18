import {List} from 'immutable'
import {Reducer} from 'redux'
import {SERVER_ACTION} from './redux-utils'

type RoomNames = List<string>

export const SET_ROOMS = 'SET_ROOMS'
export type SetRoomsAction = ReturnType<typeof setRooms>
export const setRooms = (rooms: RoomNames) => ({
	type: SET_ROOMS as typeof SET_ROOMS,
	rooms,
})

export const SET_ACTIVE_ROOM = 'SET_ACTIVE_ROOM'
export type SetActiveRoomAction = ReturnType<typeof setActiveRoom>
export const setActiveRoom = (room: string) => ({
	type: SET_ACTIVE_ROOM as typeof SET_ACTIVE_ROOM,
	room,
})

export const CHANGE_ROOM = 'CHANGE_ROOM'
export type ChangeRoomAction = ReturnType<typeof changeRoom>
export const changeRoom = (room: string) => ({
	type: CHANGE_ROOM as typeof CHANGE_ROOM,
	SERVER_ACTION,
	room,
})

export const CREATE_ROOM = 'CREATE_ROOM'
export type CreateRoomAction = ReturnType<typeof createRoom>
export const createRoom = (name: string) => ({
	type: CREATE_ROOM as typeof CREATE_ROOM,
	SERVER_ACTION,
	name,
})

export const REQUEST_CREATE_ROOM = 'REQUEST_CREATE_ROOM'
export type RequestCreateRoomAction = ReturnType<typeof requestCreateRoom>
export const requestCreateRoom = () => ({
	type: REQUEST_CREATE_ROOM as typeof REQUEST_CREATE_ROOM,
	SERVER_ACTION,
})

export const DELETE_ROOM = 'DELETE_ROOM'
export type DeleteRoomAction = ReturnType<typeof deleteRoom>
export const deleteRoom = (name: string) => ({
	type: DELETE_ROOM as typeof DELETE_ROOM,
	SERVER_ACTION,
	name,
})

export interface IRoomsState {
	names: RoomNames,
	activeRoom: string
}

export type RoomsReduxAction = SetRoomsAction | SetActiveRoomAction |
	ChangeRoomAction | CreateRoomAction | DeleteRoomAction

const initialState: IRoomsState = {
	names: List<string>(),
	activeRoom: '',
}

export const roomsReducer: Reducer<IRoomsState, RoomsReduxAction> = (state = initialState, action) => ({
	...roomsOtherReducer({activeRoom: state.activeRoom}, action),
	names: roomsNamesReducer(state ? state.names : undefined, action),
})

const roomsOtherReducer: Reducer<{activeRoom: string}, RoomsReduxAction> = (state = {activeRoom: ''}, action) => {
	switch (action.type) {
		case SET_ACTIVE_ROOM: return {...state, activeRoom: action.room}
		default: return state
	}
}

const roomsNamesReducer: Reducer<RoomNames, RoomsReduxAction> = (state = List<string>(), action) => {
	switch (action.type) {
		case CREATE_ROOM: return state.concat(action.name)
		case DELETE_ROOM: return state.filter(x => x !== action.name)
		case SET_ROOMS: return action.rooms
		default: return state
	}
}

const selectRoomsState = (state: {rooms: IRoomsState}): IRoomsState =>
	state.rooms

export const selectAllRoomNames = (state: {rooms: IRoomsState}): List<string> =>
	selectRoomsState(state).names

export const selectActiveRoom = (state: {rooms: IRoomsState}): string =>
	selectRoomsState(state).activeRoom

export const selectRoomExists = (state: {rooms: IRoomsState}, name: string): boolean =>
	selectAllRoomNames(state).includes(name)
