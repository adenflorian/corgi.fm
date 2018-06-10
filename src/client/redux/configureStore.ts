import {applyMiddleware, combineReducers, compose, createStore} from 'redux'
import {clientsReducer, IClient} from './clients-redux'
import {keysReducer} from './keys-redux'
import {virtualKeyboardsReducer, VirtualKeyboardsState} from './virtual-keyboard-redux'
import {virtualMidiKeyboardMiddleware} from './virtual-midi-keyboard-middleware'
import {websocketMiddleware} from './websocket-middleware'
import {IWebsocketState, websocketReducer} from './websocket-redux'

export interface IAppState {
	clients: IClient[]
	keys: object
	websocket: IWebsocketState
	virtualKeyboards: VirtualKeyboardsState,
	audio: any
}

declare global {
	interface Window {__REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any}
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export function configureStore(initialState: {}) {
	return createStore(
		combineReducers({
			clients: clientsReducer,
			keys: keysReducer,
			websocket: websocketReducer,
			virtualKeyboards: virtualKeyboardsReducer,
			audio: (state = {}) => state,
		}),
		initialState,
		composeEnhancers(
			applyMiddleware(
				websocketMiddleware,
				virtualMidiKeyboardMiddleware,
			),
		),
	)
}
