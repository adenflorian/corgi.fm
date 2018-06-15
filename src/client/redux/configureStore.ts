import {applyMiddleware, combineReducers, compose, createStore} from 'redux'
import persistState from 'redux-localstorage'
import {audioReducer, IAudioState} from './audio-redux'
import {clientsReducer, IClient} from './clients-redux'
import {dawReducer} from './daw-redux'
import {IOptionsState, optionsReducer} from './options-redux'
import {virtualKeyboardsReducer, VirtualKeyboardsState} from './virtual-keyboard-redux'
import {websocketMiddleware} from './websocket-middleware'
import {IWebsocketState, websocketReducer} from './websocket-redux'

export interface IAppState {
	audio: IAudioState
	clients: IClient[]
	daw: any
	options: IOptionsState
	virtualKeyboards: VirtualKeyboardsState,
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
			virtualKeyboards: virtualKeyboardsReducer,
			websocket: websocketReducer,
		}),
		initialState,
		composeEnhancers(
			applyMiddleware(
				websocketMiddleware,
			),
			persistState('options'),
		),
	)
}
