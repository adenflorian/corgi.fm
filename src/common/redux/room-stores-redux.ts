import {Store} from 'redux'
import {IServerState} from '../../server/configure-server-store'
import {configureRoomStore} from './configure-room-store'
import {CREATE_ROOM} from './rooms-redux'

export interface IRoomStoresState {
	[key: string]: Store
}

export function roomStoresReducer(state: IRoomStoresState = {}, action: any) {
	switch (action.type) {
		case CREATE_ROOM: return {
			...state,
			[action.name]: configureRoomStore(),
		}
		default: return state
	}
}
export const selectAllRoomStores = (state: IServerState) => state.roomStores

export const selectAllRoomStoresAsArray = (state: IServerState) =>
	Object.keys(selectAllRoomStores(state)).map(x => selectAllRoomStores(state)[x])

export const selectRoomStoreByName = (state: IServerState, name: string) => selectAllRoomStores(state)[name]
