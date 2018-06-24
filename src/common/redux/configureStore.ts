import {applyMiddleware, combineReducers, compose, createStore, Store} from 'redux'
import persistState from 'redux-localstorage'
import {isProd} from '../../client/is-prod'
import {ISimpleTrackState, simpleTrackReducer} from '../../common/redux/simple-track-redux'
import {audioReducer, IAudioState} from './audio-redux'
import {basicInstrumentsReducer, IBasicInstrumentsState} from './basic-instruments-redux'
import {clientsReducer, IClientsState} from './clients-redux'
import {connectionsReducer, IConnectionsState} from './connections-redux'
import {localMiddleware} from './local-middleware'
import {ILocalState, localReducer} from './local-redux'
import {IOptionsState, optionsReducer} from './options-redux'
import {trackPlayerMiddleware} from './track-player-middleware'
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
	simpleTrack: ISimpleTrackState
	virtualKeyboards: IVirtualKeyboardsState
	websocket: IWebsocketState
}

declare global {
	interface Window {__REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any}
}

const tryToUseReduxDevTools = isProd() === false

const composeEnhancers = tryToUseReduxDevTools && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export function configureStore(initialState: IAppState | any = {}): Store {
	return createStore(
		combineReducers({
			audio: audioReducer,
			basicInstruments: basicInstrumentsReducer,
			clients: clientsReducer,
			connections: connectionsReducer,
			local: localReducer,
			options: optionsReducer,
			simpleTrack: simpleTrackReducer,
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
