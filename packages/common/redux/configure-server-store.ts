import { combineReducers, createStore, Store } from 'redux'
// import { composeWithDevTools } from 'remote-redux-devtools'
import { clientsReducer, IClientsState, IRoomsState, IRoomStoresState, roomsReducer, roomStoresReducer } from '.'

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
		{},
		// TODO This throws error on start, someone can figure it out later if they need to use this
		// composeWithDevTools({
		// 	name: 'serverStore',
		// 	actionsBlacklist: getActionsBlacklist(),
		// 	maxAge: 100,
		// })(),
	)
}
