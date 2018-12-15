import {applyMiddleware, combineReducers, createStore, Store} from 'redux'
import {composeWithDevTools} from 'redux-devtools-extension/developmentOnly'
import persistState from 'redux-localstorage'
import {actionsBlacklist} from '../common-constants'
import {audioReducer, IAudioState} from './audio-redux'
import {basicInstrumentsReducer, IBasicInstrumentsState} from './basic-instruments-redux'
import {chatReducer, IChatState} from './chat-redux'
import {clientsReducer, IClientsState} from './clients-redux'
import {connectionsReducer, IConnectionsState} from './connections-redux'
import {localMiddleware} from './local-middleware'
import {ILocalState, localReducer} from './local-redux'
import {IOptionsState, optionsReducer} from './options-redux'
import {IRoomsState, roomsReducer} from './rooms-redux'
import {trackPlayerMiddleware} from './track-player-middleware'
import {ITracksState, tracksReducer} from './tracks-redux'
import {IVirtualKeyboardsState, virtualKeyboardsReducer} from './virtual-keyboard-redux'
import {websocketSenderMiddleware} from './websocket-client-sender-middleware'
import {IWebsocketState, websocketReducer} from './websocket-redux'

export interface IAppState {
	audio: IAudioState
	basicInstruments: IBasicInstrumentsState
	chat: IChatState
	clients: IClientsState
	connections: IConnectionsState
	local: ILocalState
	options: IOptionsState
	rooms: IRoomsState
	tracks: ITracksState
	virtualKeyboards: IVirtualKeyboardsState
	websocket: IWebsocketState
}

export interface ICommonState {
	rooms: IRoomsState
}

const composeEnhancers = composeWithDevTools({
	actionsBlacklist,
})

export function configureStore(initialState: IAppState | any = {}): Store {
	return createStore(
		combineReducers({
			audio: audioReducer,
			basicInstruments: basicInstrumentsReducer,
			chat: chatReducer,
			clients: clientsReducer,
			connections: connectionsReducer,
			local: localReducer,
			options: optionsReducer,
			rooms: roomsReducer,
			tracks: tracksReducer,
			virtualKeyboards: virtualKeyboardsReducer,
			websocket: websocketReducer,
		}),
		initialState,
		composeEnhancers(
			applyMiddleware(
				localMiddleware,
				trackPlayerMiddleware,
				websocketSenderMiddleware,
			),
			persistState('options'),
		),
	)
}
