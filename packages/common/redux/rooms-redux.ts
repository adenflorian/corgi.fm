import {Map} from 'immutable'
import {combineReducers, Reducer} from 'redux'
import {createSelector} from 'reselect'
import {ActionType} from 'typesafe-actions'
import {
	SERVER_ACTION, selectShamuGraphState, selectRoomSettings,
	selectAllPositions, selectGlobalClockState, selectAllConnections,
	IClientAppState,
} from '.'
import {selectExpGraphsState, ExpProjectState} from './experimental'
import {selectRoomInfoState} from './room-info-redux'
import {RoomType} from '../common-types'

export const roomsActions = {
	requestCreate: (name: string, roomType: RoomType) => ({
		type: 'REQUEST_CREATE_ROOM' as const,
		name,
		roomType,
		SERVER_ACTION,
	} as const),
} as const

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

export type RoomsReduxAction = SetRoomsAction | SetActiveRoomAction |
ChangeRoomAction | CreateRoomAction | DeleteRoomAction | UserLeftRoomAction | LoadRoomAction |
ActionType<typeof roomsActions>

export interface LocalSaves {
	readonly all: Map<Id, SavedRoom>
}

export type SavedRoom = SavedClassicRoom | SavedExpRoom | SavedDummyRoom

export interface SavedRoomBase {
	readonly roomSettings: ReturnType<typeof selectRoomSettings>
	readonly saveDateTime: string
	readonly saveClientVersion: string
	readonly saveServerVersion: string
	readonly room: string
	readonly roomType: RoomType
	readonly roomInfo: ReturnType<typeof selectRoomInfoState>
}

export interface SavedClassicRoom extends SavedRoomBase {
	readonly roomType: RoomType.Normal
	readonly connections: ReturnType<typeof selectAllConnections>
	readonly globalClock: ReturnType<typeof selectGlobalClockState>
	readonly positions: ReturnType<typeof selectAllPositions>
	readonly shamuGraph: ReturnType<typeof selectShamuGraphState>
}

export interface SavedDummyRoom extends SavedRoomBase {
	readonly roomType: RoomType.Dummy
}

export interface SavedExpRoom extends SavedRoomBase {
	readonly roomType: RoomType.Experimental
	readonly activity: ExpProjectState
}

const initialState = {
	all: Map<RoomName, Room>(),
	activeRoom: '' as string,
} as const

export type IRoomsState = typeof initialState

export type Rooms = Map<RoomName, Room>

export type RoomName = string

export interface Room {
	name: RoomName
	creationTimestamp: number
	lastTimeUserLeftTimestamp?: number
}

export const roomsReducer: Reducer<IRoomsState, RoomsReduxAction> = combineReducers({
	all: allRoomsReducer,
	activeRoom: activeRoomReducer,
})

function allRoomsReducer(rooms: Rooms = initialState.all, action: RoomsReduxAction): IRoomsState['all'] {
	switch (action.type) {
		case CREATE_ROOM: return rooms.set(action.name, {name: action.name, creationTimestamp: action.timestamp})
		case DELETE_ROOM: return rooms.delete(action.name)
		case USER_LEFT_ROOM: return rooms.update(action.name, room => ({...room, lastTimeUserLeftTimestamp: action.timestamp}))
		case SET_ROOMS: return Map<RoomName, Room>(action.rooms)
		default: return rooms
	}
}

function activeRoomReducer(activeRoom: RoomName = initialState.activeRoom, action: RoomsReduxAction): IRoomsState['activeRoom'] {
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
