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

export type IRoomsState = string[]

export const roomsReducer = createReducer([],
	{
		[ADD_ROOM]: (state: IRoomsState, {room}) => state.concat(room),
		[SET_ROOMS]: (_: IRoomsState, {rooms}) => rooms,
	},
)

export const selectAllRooms = (state: IAppState) => state.rooms
