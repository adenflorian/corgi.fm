import {Map} from 'immutable'
import {Action, combineReducers, Reducer} from 'redux'
import {basicInstrumentsReducer} from './basic-instruments-redux'
import {chatReducer} from './chat-redux'
import {IClientRoomState} from './common-redux-types'
import {IServerState} from './configure-server-store'
import {connectionsReducer} from './connections-redux'
import {roomMembersReducer} from './room-members-redux'
import {CREATE_ROOM, DELETE_ROOM, RoomsReduxAction} from './rooms-redux'
import {tracksReducer} from './tracks-redux'
import {virtualKeyboardsReducer} from './virtual-keyboard-redux'

export const ROOM_ACTION = 'ROOM_ACTION'
type RoomAction = ReturnType<typeof createRoomAction>
export const createRoomAction = (action: Action, room: string) => ({
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

const initialState: IRoomStoresState = Map<string, IClientRoomState>()

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
