import {Map} from 'immutable'
import {Action, combineReducers} from 'redux'
import {basicInstrumentsReducer} from './basic-instruments-redux'
import {chatReducer} from './chat-redux'
import {IClientRoomState} from './common-redux-types'
import {IServerState} from './configure-server-store'
import {connectionsReducer} from './connections-redux'
import {roomMembersReducer} from './room-members-redux'
import {CREATE_ROOM, DELETE_ROOM} from './rooms-redux'
import {tracksReducer} from './tracks-redux'
import {virtualKeyboardsReducer} from './virtual-keyboard-redux'

export const ROOM_ACTION = 'ROOM_ACTION'
export const roomAction = (action: Action, room: string) => ({
	type: ROOM_ACTION + '_' + room + '_' + action.type,
	room,
	action,
})

export type IRoomStoresState = Map<string, IClientRoomState>

export const roomReducers = combineReducers<IClientRoomState>({
	basicInstruments: basicInstrumentsReducer,
	chat: chatReducer,
	connections: connectionsReducer,
	members: roomMembersReducer,
	tracks: tracksReducer,
	virtualKeyboards: virtualKeyboardsReducer,
})

export function roomStoresReducer(
	state: IRoomStoresState = Map<string, IClientRoomState>(), action: any,
): IRoomStoresState {
	switch (action.type) {
		case CREATE_ROOM: return state.set(action.name, roomReducers(undefined, {type: '@@INIT'}))
		case DELETE_ROOM: return state.delete(action.name)
	}

	if (action.type.startsWith(ROOM_ACTION)) {
		return state.set(action.room, roomReducers(state.get(action.room), action.action))
	} else {
		return state
	}
}

export const selectAllRoomStates = (state: IServerState) => state.roomStores

export const selectAllRoomNames = (state: IServerState) => selectAllRoomStates(state).keySeq().toArray()

export const selectAllRoomStatesAsArray = (state: IServerState) =>
	selectAllRoomStates(state).toIndexedSeq().toArray()

export const selectRoomExists = (state: IServerState, name: string) => selectAllRoomNames(state).includes(name)

export const selectRoomStateByName = (state: IServerState, name: string) => selectAllRoomStates(state).get(name)
