import 'babel-polyfill'
import * as React from 'react'
import * as ReactGA from 'react-ga'
import {getInitialReduxState} from '../common/redux/initial-client-redux-state'
import {setupAudioContext} from '../common/setup-audio-context'
import {SamplesManager} from './BasicSampler/SamplesManager'
import {BrowserWarning} from './BrowserWarning'
import {configureStore} from './client-store'
import {fpsLoop} from './fps-loop'
import {setupInputEventListeners} from './input-events'
import {setupInstrumentManager} from './instrument-manager'
import {logClientEnv} from './is-prod-client'
import {renderApp, renderOther} from './react-main'
import {setupMidiSupport} from './setup-midi-support'
import {setupWebsocketAndListeners, socket} from './websocket-listeners'

ReactGA.initialize('UA-50585312-6')
ReactGA.pageview(window.location.pathname + window.location.search)

declare global {
	interface NodeModule {
		hot: {
			dispose: (_: () => any) => any,
			accept: (_: () => any) => any,
		}
	}
}

declare global {
	interface Window {
		chrome: any
	}
}

// Chrome 1 - 68
const isChrome = () => !!window.chrome

if (!isChrome()) {
	renderOther(<BrowserWarning />)
} else {
	setupAsync()
}

async function setupAsync() {

	logClientEnv()

	// Might be needed for safari
	const AudioContext = window.AudioContext || window.webkitAudioContext
	const audioContext = new AudioContext()
	const preFx = audioContext.createGain()

	const store = configureStore(getInitialReduxState(), audioContext)

	setupAudioContext(audioContext, preFx, store)

	await SamplesManager.initAsync(audioContext)

	setupMidiSupport(store)

	setupInputEventListeners(window, store, audioContext)

	setupWebsocketAndListeners(store)

	setupInstrumentManager(store, audioContext, preFx)

	renderApp(store)

	fpsLoop()

	if (module.hot) {
		module.hot.dispose(() => {
			socket.disconnect()
			audioContext.close()
		})
	}
}
