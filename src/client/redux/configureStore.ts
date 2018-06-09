import {applyMiddleware, combineReducers, compose, createStore} from 'redux'
import {inputMiddleware} from './input-middleware'
import {keysReducer} from './keys-redux'
import {IMidiState, midiReducer} from './midi-redux'
import {notesReducer} from './notes-redux'
import {IOtherClient, otherClientsReducer} from './other-clients-redux'
import {virtualKeyboardsReducer} from './virtual-keyboard-redux'
import {virtualMidiKeyboardMiddleware} from './virtual-midi-keyboard-middleware'
import {websocketMiddleware} from './websocket-middleware'
import {IWebsocketState, websocketReducer} from './websocket-redux'

export interface IAppState {
	otherClients: IOtherClient[]
	keys: object
	midi: IMidiState
	notes: object
	websocket: IWebsocketState
	virtualKeyboards: any
}

declare global {
	interface Window {__REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any}
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export function configureStore() {
	return createStore(
		combineReducers({
			otherClients: otherClientsReducer,
			keys: keysReducer,
			midi: midiReducer,
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
