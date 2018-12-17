import {createReducer, SERVER_ACTION} from './redux-utils'

export const SET_ROOMS = 'SET_ROOMS'
export type SetRoomsAction = ReturnType<typeof setRooms>
export const setRooms = (rooms: string[]) => ({
	type: SET_ROOMS,
	rooms,
})

export const SET_ACTIVE_ROOM = 'SET_ACTIVE_ROOM'
export type SetActiveRoomAction = ReturnType<typeof setActiveRoom>
export const setActiveRoom = (room: string) => ({
	type: SET_ACTIVE_ROOM,
	room,
})

export const CHANGE_ROOM = 'CHANGE_ROOM'
export type ChangeRoomAction = ReturnType<typeof changeRoom>
export const changeRoom = (room: string) => ({
	type: CHANGE_ROOM,
	SERVER_ACTION,
	room,
})

export const CREATE_ROOM = 'CREATE_ROOM'
export type CreateRoomAction = ReturnType<typeof createRoom>
export const createRoom = (name: string) => ({
	type: CREATE_ROOM,
	SERVER_ACTION,
	name,
})

export const REQUEST_CREATE_ROOM = 'REQUEST_CREATE_ROOM'
export type RequestCreateRoomAction = ReturnType<typeof requestCreateRoom>
export const requestCreateRoom = () => ({
	type: REQUEST_CREATE_ROOM,
	SERVER_ACTION,
})

export const DELETE_ROOM = 'DELETE_ROOM'
export type DeleteRoomAction = ReturnType<typeof deleteRoom>
export const deleteRoom = (name: string) => ({
	type: DELETE_ROOM,
	SERVER_ACTION,
	name,
})

export interface IRoomsState {
	all: string[],
	activeRoom: string
}

export type RoomsReduxAction = SetRoomsAction | SetActiveRoomAction |
	ChangeRoomAction | CreateRoomAction | DeleteRoomAction

export function roomsReducer(state: IRoomsState = {all: [], activeRoom: ''}, action: RoomsReduxAction): IRoomsState {
	return {
		...roomsOtherReducer({activeRoom: state.activeRoom}, action),
		all: roomsArrayReducer(state ? state.all : undefined, action),
	}
}

const roomsOtherReducer = createReducer({activeRoom: ''},
	{
		[SET_ACTIVE_ROOM]: (state, {room}: SetActiveRoomAction) => ({...state, activeRoom: room}),
	},
)

const roomsArrayReducer = createReducer(new Array<string>(),
	{
		[CREATE_ROOM]: (state, {name}: CreateRoomAction) => state.concat(name),
		[DELETE_ROOM]: (state, {name}: DeleteRoomAction) => state.filter(x => x !== name),
		[SET_ROOMS]: ({}, {rooms}: SetRoomsAction) => rooms,
	},
)

const selectRoomsState = (state: {rooms: IRoomsState}) => state.rooms
export const selectAllRooms = (state: {rooms: IRoomsState}) => selectRoomsState(state).all
export const selectActiveRoom = (state: {rooms: IRoomsState}) => selectRoomsState(state).activeRoom
