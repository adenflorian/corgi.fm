import {Action, combineReducers, Store} from 'redux'
import {IServerState} from '../../server/configure-server-store'
import {basicInstrumentsReducer, IBasicInstrumentsState} from './basic-instruments-redux'
import {chatReducer} from './chat-redux'
import {IAppState} from './client-store'
import {clientsReducer, IClientsState} from './clients-redux'
import {connectionsReducer, IConnectionsState} from './connections-redux'
import {CREATE_ROOM, DELETE_ROOM} from './rooms-redux'
import {ITracksState, tracksReducer} from './tracks-redux'
import {IVirtualKeyboardsState, virtualKeyboardsReducer} from './virtual-keyboard-redux'

export const ROOM_ACTION = 'ROOM_ACTION'
export const roomAction = (action: Action, room: string) => ({
	type: ROOM_ACTION + '_' + room + '_' + action.type,
	room,
	action,
})

export interface IRoomStateTree {
	basicInstruments: IBasicInstrumentsState
	clients: IClientsState
	connections: IConnectionsState
	tracks: ITracksState
	virtualKeyboards: IVirtualKeyboardsState
}

export interface IRoomStoresState {
	[key: string]: IAppState
}

const roomReducers = combineReducers({
	basicInstruments: basicInstrumentsReducer,
	chat: chatReducer,
	clients: clientsReducer,
	connections: connectionsReducer,
	tracks: tracksReducer,
	virtualKeyboards: virtualKeyboardsReducer,
})

export function roomStoresReducer(state: IRoomStoresState = {}, action: any) {
	switch (action.type) {
		case CREATE_ROOM: return {
			...state,
			[action.name]: roomReducers(undefined, {type: '@@INIT'}),
		}

		case DELETE_ROOM: {
			const newState = {...state}
			delete newState[action.name]
			return newState
		}
	}

	if (action.type.startsWith(ROOM_ACTION)) {
		return {
			...state,
			[action.room]: roomReducers(state[action.room], action.action),
		}
	} else {
		return state
	}
}

export const selectAllRoomStates = (state: IServerState) => state.roomStores

export const selectAllRoomNames = (state: IServerState) => Object.keys(selectAllRoomStates(state))

export const selectAllRoomStatesAsArray = (state: IServerState) =>
	selectAllRoomNames(state).map(x => selectAllRoomStates(state)[x])

export const selectRoomExists = (state: IServerState, name: string) => selectAllRoomNames(state).includes(name)

export const selectRoomStateByName = (state: IServerState, name: string) => selectAllRoomStates(state)[name]
