import {applyMiddleware, createStore, Store} from 'redux'
import {composeWithDevTools} from 'redux-devtools-extension/developmentOnly'
import persistState from 'redux-localstorage'
import {
	connectionsClientMiddleware, createGridSequencerPlayerMiddleware,
	getActionsBlacklist, getClientReducers, IClientAppState, localMiddleware,
} from '../common/redux'
import {websocketSenderMiddleware} from './websocket-client-sender-middleware'

const composeEnhancers = composeWithDevTools({
	actionsBlacklist: getActionsBlacklist(),
})

export function configureStore(initialState: IClientAppState | any = {})
	: Store<IClientAppState> {

	return createStore(
		getClientReducers(),
		initialState,
		composeEnhancers(
			applyMiddleware(
				localMiddleware,
				createGridSequencerPlayerMiddleware(),
				connectionsClientMiddleware,
				websocketSenderMiddleware,
			),
			persistState('options'),
		),
	)
}
