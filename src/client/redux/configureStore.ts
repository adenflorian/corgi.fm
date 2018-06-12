import {applyMiddleware, combineReducers, compose, createStore} from 'redux'
import {audioReducer, IAudioState} from './audio-redux'
import {clientsReducer, IClient} from './clients-redux'
import {virtualKeyboardsReducer, VirtualKeyboardsState} from './virtual-keyboard-redux'
import {websocketMiddleware} from './websocket-middleware'
import {IWebsocketState, websocketReducer} from './websocket-redux'

export interface IAppState {
	clients: IClient[]
	websocket: IWebsocketState
	virtualKeyboards: VirtualKeyboardsState,
	audio: IAudioState
}

declare global {
	interface Window {__REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any}
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export function configureStore(initialState: {}) {
	return createStore(
		combineReducers({
			clients: clientsReducer,
			websocket: websocketReducer,
			virtualKeyboards: virtualKeyboardsReducer,
			audio: audioReducer,
		}),
		initialState,
		composeEnhancers(
			applyMiddleware(
				websocketMiddleware,
			),
		),
	)
}
