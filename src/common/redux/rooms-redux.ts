import {Action} from 'redux'
import {IAppState} from './configureStore'
import {createReducer} from './redux-utils'

export const ADD_ROOM = 'ADD_ROOM'
export const addRoom = (room: string) => ({
	type: ADD_ROOM,
	room,
})

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

export interface IRoomsState {
	all: string[],
	activeRoom: string
}

export function roomsReducer(state: IRoomsState, action: Action<any>) {
	return {
		...roomsOtherReducer(state, action),
		rooms: roomsArrayReducer(state, action),
	}
}

const roomsOtherReducer = createReducer({},
	{
		[SET_ACTIVE_ROOM]: (state: IRoomsState, {room}) => ({...state, active: room}),
	},
)

const roomsArrayReducer = createReducer([],
	{
		[ADD_ROOM]: (state: string[], {room}) => state.concat(room),
		[SET_ROOMS]: (_, {rooms}) => rooms,
	},
)

export const selectAllRooms = (state: IAppState) => state.rooms.all
