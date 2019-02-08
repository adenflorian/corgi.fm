import {applyMiddleware, combineReducers, createStore, Store} from 'redux'
import {composeWithDevTools} from 'redux-devtools-extension/developmentOnly'
import persistState from 'redux-localstorage'
import {audioReducer, clientsReducer, connectionsMiddleware, createGridSequencerPlayerMiddleware, getActionsBlacklist, IClientAppState, localMiddleware, optionsReducer, roomReducers, roomsReducer, userInputReducer, websocketReducer} from '../common/redux'
import {websocketSenderMiddleware} from './websocket-client-sender-middleware'

const composeEnhancers = composeWithDevTools({
	actionsBlacklist: getActionsBlacklist(),
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
			userInput: userInputReducer,
		}),
		initialState,
		composeEnhancers(
			applyMiddleware(
				localMiddleware,
				createGridSequencerPlayerMiddleware(),
				connectionsMiddleware,
				websocketSenderMiddleware,
			),
			persistState('options'),
		),
	)
}
