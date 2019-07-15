import {AnyAction, combineReducers, Store} from 'redux'
import {StateType} from 'typesafe-actions'
import {authReducer} from './auth-redux'
import {
	audioReducer, BROADCASTER_ACTION, chatActionTypesWhitelist,
	clientInfoReducer, clientsReducer, inProgressReducer,
	modalsReducer, optionsReducer, pointerActionTypesWhitelist,
	roomReducers, roomsReducer, userInputReducer, websocketReducer,
} from './index'

export type IClientAppState = StateType<ReturnType<typeof getClientReducers>>

export type IClientRoomState = StateType<typeof roomReducers>

export type ClientStore = Store<IClientAppState>

export function getClientReducers() {
	return combineReducers(Object.freeze({
		audio: audioReducer,
		auth: authReducer,
		clientInfo: clientInfoReducer,
		clients: clientsReducer,
		inProgress: inProgressReducer,
		modals: modalsReducer,
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
