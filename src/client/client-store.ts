import {applyMiddleware, createStore, Store} from 'redux'
import {composeWithDevTools} from 'redux-devtools-extension/developmentOnly'
import persistState from 'redux-localstorage'
import {
	connectionsClientMiddleware, createGridSequencerPlayerMiddleware,
	createLocalMiddleware, getActionsBlacklist, getClientReducers, IClientAppState,
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
				createLocalMiddleware(),
				createGridSequencerPlayerMiddleware(),
				connectionsClientMiddleware,
				websocketSenderMiddleware,
			),
			persistState('options'),
		),
	)
}
