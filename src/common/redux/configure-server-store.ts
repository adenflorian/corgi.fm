import {combineReducers, createStore, Store} from 'redux'
import {composeWithDevTools} from 'remote-redux-devtools'
import {actionsBlacklist} from '../common-constants'
import {clientsReducer, IClientsState} from './clients-redux'
import {getInitialServerState} from './initial-server-redux-state'
import {IRoomStoresState, roomStoresReducer} from './room-stores-redux'
import {IRoomsState, roomsReducer} from './rooms-redux'

export interface IServerState {
	clients: IClientsState
	rooms: IRoomsState
	roomStores: IRoomStoresState
}

export function configureServerStore(): Store<IServerState> {
	return createStore(
		combineReducers({
			clients: clientsReducer,
			rooms: roomsReducer,
			roomStores: roomStoresReducer,
		}),
		getInitialServerState(),
		composeWithDevTools({
			name: 'serverStore',
			actionsBlacklist,
			maxAge: 100,
		})(),
	)
}
