import 'babel-polyfill'
import React from 'react'
import * as ReactGA from 'react-ga'
import {Middleware} from 'redux'
import {
	clientInfoActions, createUsername, loadOptionsState, SET_ACTIVE_ROOM, validateOptionsState,
} from '../common/redux'
import {setupAudioContext} from '../common/setup-audio-context'
import {BrowserWarning} from './BrowserWarning'
import {configureStore} from './client-store'
import {getCurrentClientVersion} from './client-utils'
import {getECSLoop} from './ECS/ECS'
import {initializeFirebase} from './Firebase/FirebaseContext'
import {getFpsLoop} from './fps-loop'
import {setupInputEventListeners} from './input-events'
import {GetAllInstruments, setupInstrumentManager} from './instrument-manager'
import {isLocalDevClient, logClientEnv} from './is-prod-client'
import {startMainRealTimeLoop} from './main-real-time-loop'
import {startNoteScanner} from './note-scanner'
import {renderApp, renderOther} from './react-main'
import {setupMidiSupport} from './setup-midi-support'
import {getUsernameFromLocalStorage, saveUsernameToLocalStorage} from './username'
import {SamplesManager} from './WebAudio/SamplesManager'
import {setStoreForSchedulerVisual, startSchedulerVisualLoop} from './WebAudio/SchedulerVisual'
import {setupWebsocketAndListeners, socket} from './websocket-listeners'

initializeAnalytics()

// tslint:disable-next-line: no-floating-promises
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

	if (getUsernameFromLocalStorage() === '') {
		saveUsernameToLocalStorage(createUsername())
	}

	// Might be needed for safari
	const AudioContext = window.AudioContext || window.webkitAudioContext
	const audioContext = new AudioContext()
	const preFx = audioContext.createGain()

	const loadedOptionsState = loadOptionsState()

	const foo: GetAllInstruments = () => getAllInstruments()

	const onReduxMiddleware: Middleware = () => next => action => {
		next(action)
		switch (action.type) {
			case SET_ACTIVE_ROOM: onSetActiveRoom()
		}
	}

	const store = configureStore({
		options: loadedOptionsState,
	}, foo, onReduxMiddleware)

	const firebaseContextStuff = initializeFirebase(store)

	validateOptionsState(store, loadedOptionsState)

	store.dispatch(clientInfoActions.setClientVersion(getCurrentClientVersion()))

	setStoreForSchedulerVisual(store)

	const {masterLimiter} = setupAudioContext(audioContext, preFx, store)

	await SamplesManager.initAsync(audioContext)

	setupMidiSupport(store)

	setupInputEventListeners(window, store, audioContext)

	setupWebsocketAndListeners(store)

	const {getAllInstruments, getAllAudioNodes} = setupInstrumentManager(store, audioContext, preFx)

	renderApp(store, firebaseContextStuff)

	const {ecsLoop, onSetActiveRoom} = getECSLoop(store, masterLimiter)

	const fpsLoop = getFpsLoop()

	const schedulerVisualLoop = startSchedulerVisualLoop()

	const noteScannerLoop = startNoteScanner(store, audioContext, getAllInstruments, getAllAudioNodes)

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
