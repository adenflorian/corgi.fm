import {applyMiddleware, combineReducers, compose, createStore} from 'redux'
import {audioContextReducer} from './audio-context-redux'
import {clientsReducer, IClient} from './clients-redux'
import {inputMiddleware} from './input-middleware'
import {keysReducer} from './keys-redux'
import {notesReducer} from './notes-redux'
import {virtualKeyboardsReducer, VirtualKeyboardsState} from './virtual-keyboard-redux'
import {virtualMidiKeyboardMiddleware} from './virtual-midi-keyboard-middleware'
import {websocketMiddleware} from './websocket-middleware'
import {IWebsocketState, websocketReducer} from './websocket-redux'

export interface IAppState {
	clients: IClient[]
	keys: object
	notes: object
	websocket: IWebsocketState
	virtualKeyboards: VirtualKeyboardsState,
	audioContext: any
}

declare global {
	interface Window {__REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any}
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export function configureStore() {
	return createStore(
		combineReducers({
			audioContext: audioContextReducer,
			clients: clientsReducer,
			keys: keysReducer,
			notes: notesReducer,
			websocket: websocketReducer,
			virtualKeyboards: virtualKeyboardsReducer,
		}),
		composeEnhancers(
			applyMiddleware(
				websocketMiddleware,
				inputMiddleware,
				virtualMidiKeyboardMiddleware,
			),
		),
	)
}
