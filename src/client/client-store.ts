import {applyMiddleware, createStore, Store} from 'redux'
import {composeWithDevTools} from 'redux-devtools-extension/developmentOnly'
import {
	createGridSequencerPlayerMiddleware,
	getActionsBlacklist, getClientReducers, IClientAppState,
} from '../common/redux'
import {connectionsClientMiddleware} from './connections-middleware'
import {createLocalMiddleware} from './local-middleware'
import {websocketSenderMiddleware} from './websocket-client-sender-middleware'

const composeEnhancers = composeWithDevTools({
	actionsBlacklist: getActionsBlacklist(),
})

export function configureStore(initialState: Partial<IClientAppState> = {})
	: Store<IClientAppState> {

	return createStore(
		getClientReducers(),
		initialState,
		composeEnhancers(
			applyMiddleware(
				createLocalMiddleware(),
				createGridSequencerPlayerMiddleware(),
				connectionsClientMiddleware,
				websocketSenderMiddleware,
			),
		),
	)
}
