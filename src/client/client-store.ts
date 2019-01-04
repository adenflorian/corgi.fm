import {applyMiddleware, combineReducers, createStore, Store} from 'redux'
import {composeWithDevTools} from 'redux-devtools-extension/developmentOnly'
import persistState from 'redux-localstorage'
import {actionsBlacklist} from '../common/common-constants'
import {audioReducer} from '../common/redux/audio-redux'
import {clientsReducer} from '../common/redux/clients-redux'
import {IClientAppState} from '../common/redux/common-redux-types'
import {complexObjectsReducer} from '../common/redux/complex-objects-redux'
import {localMiddleware} from '../common/redux/local-middleware'
import {optionsReducer} from '../common/redux/options-redux'
import {roomReducers} from '../common/redux/room-stores-redux'
import {roomsReducer} from '../common/redux/rooms-redux'
import {createTrackPlayerMiddleware} from '../common/redux/track-player-middleware'
import {websocketSenderMiddleware} from '../common/redux/websocket-client-sender-middleware'
import {websocketReducer} from '../common/redux/websocket-redux'

const composeEnhancers = composeWithDevTools({
	actionsBlacklist,
})

export function configureStore(initialState: IClientAppState | any = {}, audioContext: AudioContext)
	: Store<IClientAppState> {

	return createStore(
		combineReducers({
			audio: audioReducer,
			clients: clientsReducer,
			complexObjects: complexObjectsReducer,
			options: optionsReducer,
			rooms: roomsReducer,
			websocket: websocketReducer,
			room: roomReducers,
		}),
		initialState,
		composeEnhancers(
			applyMiddleware(
				localMiddleware,
				createTrackPlayerMiddleware(audioContext),
				websocketSenderMiddleware,
			),
			persistState('options'),
		),
	)
}