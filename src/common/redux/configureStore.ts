import {applyMiddleware, combineReducers, createStore, Store} from 'redux'
import {composeWithDevTools} from 'redux-devtools-extension/developmentOnly'
import persistState from 'redux-localstorage'
import {audioReducer, IAudioState} from './audio-redux'
import {basicInstrumentsReducer, IBasicInstrumentsState} from './basic-instruments-redux'
import {clientsReducer, IClientsState} from './clients-redux'
import {connectionsReducer, IConnectionsState} from './connections-redux'
import {localMiddleware} from './local-middleware'
import {ILocalState, localReducer} from './local-redux'
import {IOptionsState, optionsReducer} from './options-redux'
import {trackPlayerMiddleware} from './track-player-middleware'
import {ITracksState, tracksReducer} from './tracks-redux'
import {IVirtualKeyboardsState, virtualKeyboardsReducer} from './virtual-keyboard-redux'
import {websocketSenderMiddleware} from './websocket-client-sender-middleware'
import {IWebsocketState, websocketReducer} from './websocket-redux'

export interface IAppState {
	audio: IAudioState
	basicInstruments: IBasicInstrumentsState
	clients: IClientsState
	connections: IConnectionsState
	local: ILocalState
	options: IOptionsState
	tracks: ITracksState
	virtualKeyboards: IVirtualKeyboardsState
	websocket: IWebsocketState
}

const composeEnhancers = composeWithDevTools({
	actionsBlacklist: ['SET_CLIENT_POINTER', 'REPORT_LEVELS'],
})

export function configureStore(initialState: IAppState | any = {}): Store {
	return createStore(
		combineReducers({
			audio: audioReducer,
			basicInstruments: basicInstrumentsReducer,
			clients: clientsReducer,
			connections: connectionsReducer,
			local: localReducer,
			options: optionsReducer,
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
