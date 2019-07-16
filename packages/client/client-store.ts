import {applyMiddleware, createStore, Middleware, Store} from 'redux'
import {composeWithDevTools} from 'redux-devtools-extension/developmentOnly'
import {
	getActionsBlacklist, getClientReducers, IClientAppState,
} from '@corgifm/common/redux'
import {connectionsClientMiddleware} from './connections-middleware'
import {createAuthMiddleware} from './Firebase/auth-middleware'
import {FirebaseContextStuff} from './Firebase/FirebaseContext'
import {GetAllInstruments} from './instrument-manager'
import {createLocalMiddleware} from './local-middleware'
import {createSequencerMiddleware} from './sequencer-middleware'
import {websocketSenderMiddleware} from './websocket-client-sender-middleware'

const composeEnhancers = composeWithDevTools({
	actionsBlacklist: getActionsBlacklist(),
})

export function configureStore(
	initialState: Partial<IClientAppState> = {},
	getAllInstruments: GetAllInstruments,
	onReduxMiddleware: Middleware,
	firebase: FirebaseContextStuff,
): Store<IClientAppState> {

	return createStore(
		getClientReducers(),
		initialState,
		composeEnhancers(
			applyMiddleware(
				onReduxMiddleware,
				createLocalMiddleware(getAllInstruments),
				createAuthMiddleware(firebase),
				createSequencerMiddleware(getAllInstruments),
				connectionsClientMiddleware(getAllInstruments),
				websocketSenderMiddleware,
			),
		),
	)
}
