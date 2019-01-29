import {combineReducers, createStore, Store} from 'redux'
import {composeWithDevTools} from 'remote-redux-devtools'
import {actionsBlacklist} from '../common-constants'
import {clientsReducer, getInitialServerState, IClientsState, IRoomsState, IRoomStoresState, roomsReducer, roomStoresReducer} from './index'

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
