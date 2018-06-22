import {applyMiddleware, combineReducers, compose, createStore, Store} from 'redux'
import persistState from 'redux-localstorage'
import {ISimpleTrackState, simpleTrackReducer} from '../../common/redux/simple-track-redux'
import {audioReducer, IAudioState} from './audio-redux'
import {basicInstrumentsReducer, IBasicInstrumentsState} from './basic-instruments-redux'
import {clientsReducer, IClient} from './clients-redux'
import {IOptionsState, optionsReducer} from './options-redux'
import {trackPlayerMiddleware} from './track-player-middleware'
import {virtualKeyboardsReducer, VirtualKeyboardsState} from './virtual-keyboard-redux'
import {IWebsocketState, websocketReducer} from './websocket-redux'
import {websocketSenderMiddleware} from './websocket-sender-middleware'

export interface IAppState {
	audio: IAudioState
	basicInstruments: IBasicInstrumentsState
	clients: IClient[]
	options: IOptionsState
	simpleTrack: ISimpleTrackState
	virtualKeyboards: VirtualKeyboardsState
	websocket: IWebsocketState
}

declare global {
	interface Window {__REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any}
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export function configureStore(initialState: IAppState | any = {}): Store {
	return createStore(
		combineReducers({
			audio: audioReducer,
			basicInstruments: basicInstrumentsReducer,
			clients: clientsReducer,
			options: optionsReducer,
			simpleTrack: simpleTrackReducer,
			virtualKeyboards: virtualKeyboardsReducer,
			websocket: websocketReducer,
		}),
		initialState,
		composeEnhancers(
			applyMiddleware(
				websocketSenderMiddleware,
				trackPlayerMiddleware,
			),
			persistState('options'),
		),
	)
}
