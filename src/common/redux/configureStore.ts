import {applyMiddleware, combineReducers, compose, createStore} from 'redux'
import persistState from 'redux-localstorage'
import {ISimpleTrackState, simpleTrackReducer} from '../../common/redux/simple-track-redux'
import {audioReducer, IAudioState} from './audio-redux'
import {clientsReducer, IClient} from './clients-redux'
import {dawReducer} from './daw-redux'
import {IOptionsState, optionsReducer} from './options-redux'
import {trackPlayerMiddleware} from './track-player-middleware'
import {virtualKeyboardsReducer, VirtualKeyboardsState} from './virtual-keyboard-redux'
import {IWebsocketState, websocketReducer} from './websocket-redux'
import {websocketSenderMiddleware} from './websocket-sender-middleware'

export interface IAppState {
	audio: IAudioState
	clients: IClient[]
	daw: any
	options: IOptionsState
	simpleTrack: ISimpleTrackState
	virtualKeyboards: VirtualKeyboardsState
	websocket: IWebsocketState
}

declare global {
	interface Window {__REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any}
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export function configureStore(initialState: {}) {
	return createStore(
		combineReducers({
			audio: audioReducer,
			clients: clientsReducer,
			daw: dawReducer,
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
