import {applyMiddleware, createStore, Middleware, Store} from 'redux'
// eslint-disable-next-line import/named
import {composeWithDevTools} from 'redux-devtools-extension/developmentOnly'
import {
	getActionsBlacklist, getClientReducers, IClientAppState,
} from '@corgifm/common/redux'
import {makeConnectionsClientMiddleware} from './connections-middleware'
import {createAuthMiddleware} from './Firebase/auth-middleware'
import {FirebaseContextStuff} from './Firebase/FirebaseContext'
import {GetAllInstruments} from './instrument-manager'
import {createLocalMiddleware} from './local-middleware'
import {createSequencerMiddleware} from './sequencer-middleware'
import {websocketSenderMiddleware} from './websocket-client-sender-middleware'
import {createCorgiApiMiddleware} from './RestClient/corgi-api-middleware'
import {createSamplesManagerMiddleware} from './WebAudio/samples-manager-middleware'
import {SamplesManager} from './WebAudio'

const composeEnhancers = composeWithDevTools({
	actionsBlacklist: getActionsBlacklist(),
})

export function configureStore(
	initialState: Partial<IClientAppState> = {},
	getAllInstruments: GetAllInstruments,
	onReduxMiddleware: Middleware,
	firebase: FirebaseContextStuff,
	samplesManager: SamplesManager,
): Store<IClientAppState> {
	return createStore(
		getClientReducers(),
		initialState,
		composeEnhancers(
			applyMiddleware(
				onReduxMiddleware,
				createSamplesManagerMiddleware(samplesManager),
				createLocalMiddleware(getAllInstruments, firebase),
				createAuthMiddleware(firebase),
				createCorgiApiMiddleware(firebase, samplesManager),
				createSequencerMiddleware(getAllInstruments),
				makeConnectionsClientMiddleware(getAllInstruments),
				websocketSenderMiddleware,
			),
		),
	)
}
