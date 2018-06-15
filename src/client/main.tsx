import {setupInputEventListeners} from './input-events'
import {logger} from './logger'
import {setupMidiSupport} from './MIDI/setup-midi-support'
import {renderApp} from './react-main'
import {configureStore} from './redux/configureStore'
import {getInitialReduxState} from './redux/initial-redux-state'
import {setupAudioContext} from './setup-audio-context'
import {setupWebsocket} from './websocket'

const store = configureStore(getInitialReduxState())

setupAudioContext(store)

setupMidiSupport(store, logger)

setupInputEventListeners(window, store)

setupWebsocket(store)

renderApp(store)

module.hot.accept(() => renderApp(store))

declare global {
	interface NodeModule {
		hot: {
			dispose: (_: () => any) => any,
			accept: (_: () => any) => any,
		}
	}
}
