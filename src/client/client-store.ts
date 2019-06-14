import {applyMiddleware, createStore, Store} from 'redux'
import {composeWithDevTools} from 'redux-devtools-extension/developmentOnly'
import {
	getActionsBlacklist, getClientReducers, IClientAppState,
} from '../common/redux'
import {connectionsClientMiddleware} from './connections-middleware'
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
): Store<IClientAppState> {

	return createStore(
		getClientReducers(),
		initialState,
		composeEnhancers(
			applyMiddleware(
				createLocalMiddleware(getAllInstruments),
				createSequencerMiddleware(getAllInstruments),
				connectionsClientMiddleware(getAllInstruments),
				websocketSenderMiddleware,
			),
		),
	)
}
