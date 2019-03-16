import {AnyAction, combineReducers, Store} from 'redux'
import {StateType} from 'typesafe-actions'
import {clientInfoReducer} from './client-info-redux'
import {
	audioReducer, clientsReducer, optionsReducer, roomReducers,
	roomsReducer, userInputReducer, websocketReducer,
} from './index'
import {BROADCASTER_ACTION} from './redux-utils'

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

export interface BroadcastAction extends AnyAction {
	alreadyBroadcasted: boolean
	[BROADCASTER_ACTION]: any
}
