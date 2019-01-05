import {applyMiddleware, combineReducers, createStore, Store} from 'redux'
import {composeWithDevTools} from 'redux-devtools-extension/developmentOnly'
import persistState from 'redux-localstorage'
import {actionsBlacklist} from '../common/common-constants'
import {audioReducer} from '../common/redux/audio-redux'
import {clientsReducer} from '../common/redux/clients-redux'
import {IClientAppState} from '../common/redux/common-redux-types'
import {createGridSequencerPlayerMiddleware} from '../common/redux/grid-sequencer-player-middleware'
import {localMiddleware} from '../common/redux/local-middleware'
import {optionsReducer} from '../common/redux/options-redux'
import {roomReducers} from '../common/redux/room-stores-redux'
import {roomsReducer} from '../common/redux/rooms-redux'
import {websocketSenderMiddleware} from '../common/redux/websocket-client-sender-middleware'
import {websocketReducer} from '../common/redux/websocket-redux'

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
