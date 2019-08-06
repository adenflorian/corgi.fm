import {AnyAction, combineReducers, Store} from 'redux'
import {StateType} from 'typesafe-actions'
import {
	audioReducer, BROADCASTER_ACTION, chatActionTypesWhitelist,
	clientInfoReducer, clientsReducer, inProgressReducer,
	modalsReducer, optionsReducer, pointerActionTypesWhitelist,
	roomReducers, roomsReducer, userInputReducer, websocketReducer,
	UserInputAction, RoomAction, WebsocketReduxActions,
	RoomsReduxAction, ModalsAction, InProgressAction, OptionsAction,
	ClientInfoAction, AudioReduxAction, authReducer, AuthAction,
} from '.'
import {clientsActionTypesWhitelist} from './clients-redux';

export interface IClientAppState extends StateType<ReturnType<typeof getClientReducers>> {}

export interface IClientRoomState extends StateType<typeof roomReducers> {}

export type ClientStore = Store<IClientAppState>

export function getClientReducers() {
	return combineReducers({
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
	})
}

export interface BroadcastAction extends Readonly<AnyAction> {
	alreadyBroadcasted: boolean
	[BROADCASTER_ACTION]: any
}

export const whitelistedRoomActionTypes = chatActionTypesWhitelist
	.concat(pointerActionTypesWhitelist)
	.concat(clientsActionTypesWhitelist)

export type CLIENT_APP_ACTION = AudioReduxAction | AuthAction | ClientInfoAction |
InProgressAction | ModalsAction | OptionsAction | RoomsReduxAction |
WebsocketReduxActions | RoomAction | UserInputAction
