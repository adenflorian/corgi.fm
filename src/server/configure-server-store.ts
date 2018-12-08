import {combineReducers, createStore} from 'redux'
import devToolsEnhancer from 'remote-redux-devtools'
import {IRoomStoresState, roomStoresReducer} from '../common/redux/room-stores-redux'
import {IRoomsState, roomsReducer} from '../common/redux/rooms-redux'
import {getInitialServerState} from './initial-server-redux-state'

export interface IServerState {
	rooms: IRoomsState
	roomStores: IRoomStoresState
}

export function configureServerStore() {
	return createStore(
		combineReducers({
			rooms: roomsReducer,
			roomStores: roomStoresReducer,
		}),
		getInitialServerState(),
		devToolsEnhancer(),
	)
}
