import {applyMiddleware, combineReducers, compose, createStore} from 'redux'
import {notesMiddleware} from './notes-middleware'
import {notesReducer} from './notes-redux'
import {IOtherClient, otherClientsReducer} from './other-clients-redux'
import {websocketMiddleware} from './websocket-middleware'
import {IWebsocketState, websocketReducer} from './websocket-redux'

declare global {
	interface Window {__REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any}
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export function configureStore() {
	return createStore(
		combineReducers({
			otherClients: otherClientsReducer,
			keys: keysReducer,
			notes: notesReducer,
			websocket: websocketReducer,
		}),
		composeEnhancers(
			applyMiddleware(
				websocketMiddleware,
				notesMiddleware,
			),
		),
	)
}

export interface IAppState {
	otherClients: IOtherClient[]
	keys: object
	notes: object
	websocket: IWebsocketState
}

export const rootReducer = combineReducers({
	otherClients: otherClientsReducer,
	keys: keysReducer,
	notes: notesReducer,
	websocket: websocketReducer,
})

function keysReducer(state = {}, action) {
	switch (action.type) {
		case 'KEY_DOWN':
			return {...state, [action.e.key]: true}
		case 'KEY_UP':
			return {...state, [action.e.key]: false}
		default:
			return state
	}
}
