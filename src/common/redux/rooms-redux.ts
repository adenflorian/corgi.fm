import {Action} from 'redux'
import {IAppState} from './configureStore'
import {createReducer, SERVER_ACTION} from './redux-utils'

export const SET_ROOMS = 'SET_ROOMS'
export const setRooms = (rooms: string[]) => ({
	type: SET_ROOMS,
	rooms,
})

export const SET_ACTIVE_ROOM = 'SET_ACTIVE_ROOM'
export const setActiveRoom = room => ({
	type: SET_ACTIVE_ROOM,
	room,
})

export const CHANGE_ROOM = 'CHANGE_ROOM'
export const changeRoom = room => ({
	type: CHANGE_ROOM,
	SERVER_ACTION,
	room,
})

export const CREATE_ROOM = 'CREATE_ROOM'
export const createRoom = (name?: string) => ({
	type: CREATE_ROOM,
	SERVER_ACTION,
	name,
})

export interface IRoomsState {
	all: string[],
	activeRoom: string
}

export function roomsReducer(state: IRoomsState, action: Action<any>) {
	return {
		...roomsOtherReducer(state, action),
		all: roomsArrayReducer(state ? state.all : undefined, action),
	}
}

const roomsOtherReducer = createReducer({},
	{
		[SET_ACTIVE_ROOM]: (state: IRoomsState, {room}) => ({...state, activeRoom: room}),
	},
)

const roomsArrayReducer = createReducer([],
	{
		[CREATE_ROOM]: (state: string[], {name}) => state.concat(name),
		[SET_ROOMS]: (_, {rooms}) => rooms,
	},
)

const selectRoomsState = (state: IAppState) => state.rooms
export const selectAllRooms = (state: IAppState) => selectRoomsState(state).all
export const selectActiveRoom = (state: IAppState) => selectRoomsState(state).activeRoom
