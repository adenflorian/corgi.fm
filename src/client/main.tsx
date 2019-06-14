import 'babel-polyfill'
import * as React from 'react'
import * as ReactGA from 'react-ga'
import {clientInfoActions, loadOptionsState, validateOptionsState} from '../common/redux'
import {setupAudioContext} from '../common/setup-audio-context'
import {BrowserWarning} from './BrowserWarning'
import {configureStore} from './client-store'
import {getCurrentClientVersion} from './client-utils'
import {getECSLoop} from './ECS/ECS'
import {getFpsLoop} from './fps-loop'
import {setupInputEventListeners} from './input-events'
import {setupInstrumentManager} from './instrument-manager'
import {isLocalDevClient, logClientEnv} from './is-prod-client'
import {startMainRealTimeLoop} from './main-real-time-loop'
import {startNoteScanner} from './note-scanner'
import {renderApp, renderOther} from './react-main'
import {setupMidiSupport} from './setup-midi-support'
import {SamplesManager} from './WebAudio/SamplesManager'
import {setStoreForSchedulerVisual, startSchedulerVisualLoop} from './WebAudio/SchedulerVisual'
import {setupWebsocketAndListeners, socket} from './websocket-listeners'

initializeAnalytics()

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

function initializeAnalytics() {
	ReactGA.initialize('UA-50585312-6')
	ReactGA.pageview(window.location.pathname + window.location.search)
}

function start() {
	switch (window.location.pathname.replace('/', '')) {
		default: return setupAsync()
	}
}

async function setupAsync() {

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

	const loadedOptionsState = loadOptionsState()

	const store = configureStore({
		options: loadedOptionsState,
	})

	validateOptionsState(store, loadedOptionsState)

	store.dispatch(clientInfoActions.setClientVersion(getCurrentClientVersion()))

	setStoreForSchedulerVisual(store)

	setupAudioContext(audioContext, preFx, store)

	await SamplesManager.initAsync(audioContext)

	setupMidiSupport(store)

	setupInputEventListeners(window, store, audioContext)

	setupWebsocketAndListeners(store)

	setupInstrumentManager(store, audioContext, preFx)

	renderApp(store)

	const ecsLoop = getECSLoop(store)

	const fpsLoop = getFpsLoop()

	const schedulerVisualLoop = startSchedulerVisualLoop()

	const noteScannerLoop = startNoteScanner(store, audioContext)

	startMainRealTimeLoop(Object.freeze([
		noteScannerLoop,
		ecsLoop,
		schedulerVisualLoop,
		fpsLoop,
	]))

	if (module.hot) {
		module.hot.dispose(() => {
			socket.disconnect()
			audioContext.close()
		})
	}
}
