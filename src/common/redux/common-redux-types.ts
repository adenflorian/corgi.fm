import {AnyAction, combineReducers} from 'redux'
import {StateType} from 'typesafe-actions'
import {
	audioReducer, clientsReducer, optionsReducer, roomReducers,
	roomsReducer, userInputReducer, websocketReducer,
} from './index'
import {BROADCASTER_ACTION} from './redux-utils'

export type IClientAppState = StateType<ReturnType<typeof getClientReducers>>

export type IClientRoomState = StateType<typeof roomReducers>

export function getClientReducers() {
	return combineReducers(Object.freeze({
		audio: audioReducer,
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
