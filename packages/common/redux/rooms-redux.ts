import {Map} from 'immutable'
import {combineReducers, Reducer} from 'redux'
import {createSelector} from 'reselect'
import {IClientAppState} from './common-redux-types'
import {selectAllConnections} from './connections-redux'
import {selectGlobalClockState} from './global-clock-redux'
import {selectAllPositions} from './positions-redux'
import {selectRoomSettings} from './room-settings-redux'
import {selectShamuGraphState} from './shamu-graph'
import {SERVER_ACTION} from './index'

export const SET_ROOMS = 'SET_ROOMS'
export type SetRoomsAction = ReturnType<typeof setRooms>
export const setRooms = (rooms: Rooms) => ({
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
export const createRoom = (name: string, timestamp: number) => ({
	type: CREATE_ROOM as typeof CREATE_ROOM,
	SERVER_ACTION,
	name,
	timestamp,
})

export const USER_LEFT_ROOM = 'USER_LEFT_ROOM'
export type UserLeftRoomAction = ReturnType<typeof userLeftRoom>
export const userLeftRoom = (name: string, timestamp: number) => ({
	type: USER_LEFT_ROOM as typeof USER_LEFT_ROOM,
	SERVER_ACTION,
	name,
	timestamp,
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

export const LOAD_ROOM = 'LOAD_ROOM'
export type LoadRoomAction = ReturnType<typeof loadRoom>
export const loadRoom = (savedRoom: SavedRoom) => ({
	type: LOAD_ROOM as typeof LOAD_ROOM,
	savedRoom,
	SERVER_ACTION,
})

export type RoomsReduxAction = SetRoomsAction | SetActiveRoomAction | RequestCreateRoomAction |
	ChangeRoomAction | CreateRoomAction | DeleteRoomAction | UserLeftRoomAction | LoadRoomAction

export interface LocalSaves {
	all: {
		[key: string]: SavedRoom,
	}
}

export interface SavedRoom {
	connections: ReturnType<typeof selectAllConnections>,
	globalClock: ReturnType<typeof selectGlobalClockState>,
	positions: ReturnType<typeof selectAllPositions>,
	roomSettings: ReturnType<typeof selectRoomSettings>,
	shamuGraph: ReturnType<typeof selectShamuGraphState>,
	saveDateTime: string,
	saveClientVersion: string,
	saveServerVersion: string,
	room: string,
}

const initialState = Object.freeze({
	all: Map<RoomName, Room>(),
	activeRoom: '',
})

export type IRoomsState = typeof initialState

export type Rooms = Map<RoomName, Room>

export type RoomName = string

export interface Room {
	name: RoomName,
	creationTimestamp: number,
	lastTimeUserLeftTimestamp?: number,
}

export const roomsReducer: Reducer<IRoomsState, RoomsReduxAction> = combineReducers({
	all: allRoomsReducer,
	activeRoom: activeRoomReducer,
})

function allRoomsReducer(rooms: Rooms = initialState.all, action: RoomsReduxAction) {
	switch (action.type) {
		case CREATE_ROOM: return rooms.set(action.name, {name: action.name, creationTimestamp: action.timestamp})
		case DELETE_ROOM: return rooms.delete(action.name)
		case USER_LEFT_ROOM: return rooms.update(action.name, room => ({...room, lastTimeUserLeftTimestamp: action.timestamp}))
		case SET_ROOMS: return Map<RoomName, Room>(action.rooms)
		default: return rooms
	}
}

function activeRoomReducer(activeRoom: RoomName = initialState.activeRoom, action: RoomsReduxAction) {
	switch (action.type) {
		case SET_ACTIVE_ROOM: return action.room
		default: return activeRoom
	}
}

const selectRoomsState = (state: {rooms: IRoomsState}): IRoomsState =>
	state.rooms

export const selectAllRooms = (state: {rooms: IRoomsState}): Rooms =>
	selectRoomsState(state).all

export const selectAllRoomNames = createSelector(
	selectRoomsState,
	rooms => rooms.all.keySeq().toList(),
)

export const selectActiveRoom = ({rooms: {activeRoom}}: IClientAppState) =>
	activeRoom

export const selectRoomExists = (state: {rooms: IRoomsState}, name: string): boolean =>
	selectAllRoomNames(state).includes(name)
