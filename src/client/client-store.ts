import {applyMiddleware, combineReducers, createStore, Store} from 'redux'
import {composeWithDevTools} from 'redux-devtools-extension/developmentOnly'
import persistState from 'redux-localstorage'
import {actionsBlacklist} from '../common/common-constants'
import {audioReducer, clientsReducer, createGridSequencerPlayerMiddleware, IClientAppState, localMiddleware, optionsReducer, roomReducers, roomsReducer, websocketReducer} from '../common/redux'
import {websocketSenderMiddleware} from './websocket-client-sender-middleware'

const composeEnhancers = composeWithDevTools({
	actionsBlacklist,
})

export function configureStore(initialState: IClientAppState | any = {})
	: Store<IClientAppState> {

	return createStore(
		combineReducers({
			audio: audioReducer,
			clients: clientsReducer,
			options: optionsReducer,
			rooms: roomsReducer,
			websocket: websocketReducer,
			room: roomReducers,
		}),
		initialState,
		composeEnhancers(
			applyMiddleware(
				localMiddleware,
				createGridSequencerPlayerMiddleware(),
				websocketSenderMiddleware,
			),
			persistState('options'),
		),
	)
}
