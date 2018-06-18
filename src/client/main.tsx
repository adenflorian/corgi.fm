import {logger} from '../common/logger'
import {setupInputEventListeners} from './input-events'
import {setupMidiSupport} from './MIDI/setup-midi-support'
import {renderApp} from './react-main'
import {configureStore, IAppState} from './redux/configureStore'
import {getInitialReduxState} from './redux/initial-redux-state'
import {setupAudioContext} from './setup-audio-context'
import {setupWebsocketAndListeners} from './websocket-listeners'

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

	module.hot.accept(() => renderApp(store))

	module.hot.dispose(() => state.websocket.socket.disconnect())
	module.hot.dispose(() => state.audio.context.close())
}
