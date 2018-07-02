import {logger} from '../common/logger'
import {configureStore, IAppState} from '../common/redux/configureStore'
import {getInitialReduxState} from '../common/redux/initial-client-redux-state'
import {setupInputEventListeners} from './input-events'
import {renderApp} from './react-main'
import {audioContext, setupAudioContext} from './setup-audio-context'
import {setupMidiSupport} from './setup-midi-support'
import {setupWebsocketAndListeners, socket} from './websocket-listeners'

const store = configureStore(getInitialReduxState())

setupAudioContext(store)

setupMidiSupport(store, logger)

setupInputEventListeners(window, store)

setupWebsocketAndListeners(store)

renderApp(store)

declare global {
	interface NodeModule {
		hot: {
			dispose: (_: () => any) => any,
			accept: (_: () => any) => any,
		}
	}
}

if (module.hot) {
	const state: IAppState = store.getState()

	module.hot.dispose(() => socket.disconnect())
	module.hot.dispose(() => audioContext.close())

	module.hot.accept(() => renderApp(store))
}
