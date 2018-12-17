import {getInitialReduxState} from '../common/redux/initial-client-redux-state'
import {audioContext, setupAudioContext} from '../common/setup-audio-context'
import {configureStore} from './client-store'
import {fpsLoop} from './fps-loop'
import {setupInputEventListeners} from './input-events'
import {logClientEnv} from './is-prod-client'
import {renderApp} from './react-main'
import {setupMidiSupport} from './setup-midi-support'
import {setupWebsocketAndListeners, socket} from './websocket-listeners'

logClientEnv()

const store = configureStore(getInitialReduxState())

setupAudioContext(store)

setupMidiSupport(store)

setupInputEventListeners(window, store)

setupWebsocketAndListeners(store)

renderApp(store)

fpsLoop()

declare global {
	interface NodeModule {
		hot: {
			dispose: (_: () => any) => any,
			accept: (_: () => any) => any,
		}
	}
}

if (module.hot) {
	module.hot.dispose(() => {
		socket.disconnect()
		audioContext.close()
	})
}
