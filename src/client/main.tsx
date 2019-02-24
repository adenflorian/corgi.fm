import 'babel-polyfill'
import * as React from 'react'
import * as ReactGA from 'react-ga'
import {setupAudioContext} from '../common/setup-audio-context'
import {BrowserWarning} from './BrowserWarning'
import {configureStore} from './client-store'
import {startFpsLoop} from './fps-loop'
import {setupInputEventListeners} from './input-events'
import {setupInstrumentManager} from './instrument-manager'
import {isLocalDevClient, logClientEnv} from './is-prod-client'
import {loadExperiment} from './main-experiment'
import {startNoteScanner} from './note-scanner'
import {renderApp, renderOther} from './react-main'
import {setupMidiSupport} from './setup-midi-support'
import {SamplesManager} from './WebAudio/SamplesManager'
import {setupWebsocketAndListeners, socket} from './websocket-listeners'

ReactGA.initialize('UA-50585312-6')
ReactGA.pageview(window.location.pathname + window.location.search)

start()

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

function start() {
	switch (window.location.pathname.replace('/', '')) {
		case 'exp': return loadExperiment()
		default: return setupAsync()
	}
}

async function setupAsync() {

	const isNewNoteScannerEnabled = window.location.pathname.replace('/', '') === 'scan'

	// Chrome 1 - 68
	const isChrome = () => !!window.chrome

	if (!isChrome() && !isLocalDevClient()) {
		return renderOther(<BrowserWarning />)
	}

	logClientEnv()

	// Might be needed for safari
	const AudioContext = window.AudioContext || window.webkitAudioContext
	const audioContext = new AudioContext()
	const preFx = audioContext.createGain()

	const store = configureStore()

	setupAudioContext(audioContext, preFx, store)

	await SamplesManager.initAsync(audioContext)

	setupMidiSupport(store)

	setupInputEventListeners(window, store, audioContext)

	setupWebsocketAndListeners(store)

	setupInstrumentManager(store, audioContext, preFx, isNewNoteScannerEnabled)

	renderApp(store)

	startFpsLoop()

	if (isNewNoteScannerEnabled) {
		startNoteScanner(store, audioContext)
	}

	if (module.hot) {
		module.hot.dispose(() => {
			socket.disconnect()
			audioContext.close()
		})
	}
}
