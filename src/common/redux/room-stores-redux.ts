import {Map} from 'immutable'
import {Action, combineReducers, Reducer} from 'redux'
import {
	chatReducer, connectionsReducer, CREATE_ROOM, DELETE_ROOM,
	globalClockReducer, IClientRoomState, IServerState,
	pointersStateReducer, positionsReducer, roomMembersReducer,
	RoomsReduxAction, shamuGraphReducer,
} from './index'
import {ghostConnectionsReducer} from './ghost-connections-redux';

export const ROOM_ACTION = 'ROOM_ACTION'
type RoomAction = ReturnType<typeof createRoomAction>
export const createRoomAction = (action: Action, room: string) => ({
	type: ROOM_ACTION + '_' + room + '_' + action.type,
	room,
	action,
})

// Used on the client, because a client is only in one room at a time
export const roomReducers = combineReducers({
	chat: chatReducer,
	connections: connectionsReducer,
	globalClock: globalClockReducer,
	ghostConnections: ghostConnectionsReducer,
	members: roomMembersReducer,
	positions: positionsReducer,
	shamuGraph: shamuGraphReducer,
	pointers: pointersStateReducer,
})

const initialState = Map<string, IClientRoomState>()

export type IRoomStoresState = typeof initialState

// Used on the server, because the server tracks multiple rooms
export const roomStoresReducer: Reducer<IRoomStoresState, RoomsReduxAction> = (state = initialState, action) => {
	switch (action.type) {
		case CREATE_ROOM: return state.set(action.name, roomReducers(undefined, {type: '@@INIT'}))
		case DELETE_ROOM: return state.delete(action.name)
	}

	if (action.type.startsWith(ROOM_ACTION)) {
		const roomAction = action as RoomAction
		return state.set(roomAction.room, roomReducers(state.get(roomAction.room), roomAction.action))
	} else {
		return state
	}
}

export const selectAllRoomStates = (state: IServerState): IRoomStoresState =>
	state.roomStores

export const selectAllRoomStatesAsArray = (state: IServerState): IClientRoomState[] =>
	selectAllRoomStates(state).toIndexedSeq().toArray()

export const selectRoomStateByName = (state: IServerState, name: string) =>
	selectAllRoomStates(state).get(name)
