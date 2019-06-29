import {AnyAction, combineReducers, Store} from 'redux'
import {StateType} from 'typesafe-actions'
import {
	audioReducer, BROADCASTER_ACTION, chatActionTypesWhitelist, clientInfoReducer, clientsReducer, optionsReducer,
	pointerActionTypesWhitelist, roomReducers, roomsReducer, userInputReducer, websocketReducer,
} from './index'

export type IClientAppState = StateType<ReturnType<typeof getClientReducers>>

export type IClientRoomState = StateType<typeof roomReducers>

export type ClientStore = Store<IClientAppState>

export function getClientReducers() {
	return combineReducers(Object.freeze({
		audio: audioReducer,
		clientInfo: clientInfoReducer,
		clients: clientsReducer,
		options: optionsReducer,
		rooms: roomsReducer,
		websocket: websocketReducer,
		room: roomReducers,
		userInput: userInputReducer,
	}))
}

export interface BroadcastAction extends Readonly<AnyAction> {
	alreadyBroadcasted: boolean
	[BROADCASTER_ACTION]: any
}

export const whitelistedRoomActionTypes = chatActionTypesWhitelist
	.concat(pointerActionTypesWhitelist)
