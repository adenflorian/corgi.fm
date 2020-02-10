import React from 'react'
import * as ReactGA from 'react-ga'
import {Middleware} from 'redux'
import {
	clientInfoActions, createUsername, loadOptionsState,
	SET_ACTIVE_ROOM, validateOptionsState,
} from '@corgifm/common/redux'
import {setupAudioContext} from '@corgifm/common/setup-audio-context'
import {initSentry} from './analytics/sentry'
import {BrowserWarning} from './BrowserWarning'
import {configureStore} from './client-store'
import {getCurrentClientVersion} from './client-utils'
import {getECSLoop} from './ECS/ECS'
import {initializeFirebase, wireUpFirebaseToRedux} from './Firebase/FirebaseContext'
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
import {SingletonContextImpl} from './SingletonContext'
import {simpleGlobalClientState} from './SimpleGlobalClientState'
import {createExpTupperware} from './Experimental/experimental-middleware'
import {MidiService} from './ClientServices/MidiService'
import {WebSocketService} from './ClientServices/WebSocketService'
import {loadAudioWorkletsAsync} from './WebAudio/AudioWorklets/audio-worklets'

if (!isLocalDevClient()) initSentry()

initializeAnalytics()

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start()

declare global {
	interface NodeModule {
		hot: {
			dispose: (_: () => any) => any
			accept: (_: () => any) => any
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

async function start() {
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
	const audioContext = new AudioContext() as AudioContext
	simpleGlobalClientState.resetAnalyserDumpNode(audioContext)
	const preMasterLimiter = audioContext.createGain()

	const samplesManager = new SamplesManager(audioContext)

	const loadedOptionsState = loadOptionsState()

	if (!loadedOptionsState.disableAudioWorklet) {
		// https://bugs.chromium.org/p/chromium/issues/detail?id=1006844
		await loadAudioWorkletsAsync(audioContext)
	}

	const getGetAllInstruments: GetAllInstruments = () => getAllInstruments()

	const firebaseContextStuff = initializeFirebase()

	const onReduxMiddleware: Middleware = () => next => function onReduxMiddlewareInner(action) {
		next(action)
		switch (action.type) {
			case SET_ACTIVE_ROOM: return onSetActiveRoom()
			default: return
		}
	}

	const initialState = {
		options: loadedOptionsState,
	}

	const singletonContext = new SingletonContextImpl(
		audioContext,
		preMasterLimiter,
		new MidiService(),
		new WebSocketService(),
		samplesManager,
	)

	const store = configureStore(
		initialState, getGetAllInstruments, onReduxMiddleware,
		firebaseContextStuff, samplesManager, singletonContext)

	singletonContext.setStore(store)

	store.subscribe(createExpTupperware(store, singletonContext))

	wireUpFirebaseToRedux(firebaseContextStuff, store)

	validateOptionsState(store, loadedOptionsState)

	store.dispatch(clientInfoActions.setClientVersion(getCurrentClientVersion()))

	setStoreForSchedulerVisual(store)

	const {masterLimiter} = setupAudioContext(audioContext, preMasterLimiter, store)

	setupMidiSupport(store)

	setupInputEventListeners(window, store, audioContext)

	const {getAllInstruments, getAllAudioNodes} =
		setupInstrumentManager(store, audioContext, preMasterLimiter, samplesManager)

	// Rendering before websocket stuff so anything that needs
	// to be setup from inside a react component can be done
	// before we start receiving events over the network
	// (like NodeManagerRoot component)
	renderApp(store, firebaseContextStuff, singletonContext)

	singletonContext.webSocketService.connect(store, singletonContext)

	const {ecsLoop, onSetActiveRoom} = getECSLoop(store, masterLimiter)

	startMainRealTimeLoop([
		() => {
			const nodeManager = singletonContext.getNodeManager()
			if (nodeManager) nodeManager.onTick()
		},
		startNoteScanner(store, audioContext, getAllInstruments, getAllAudioNodes),
		ecsLoop,
		startSchedulerVisualLoop(),
		getFpsLoop(),
	])

	if (module.hot) {
		module.hot.dispose(async () => {
			singletonContext.webSocketService.dispose()
			await audioContext.close()
		})
	}
}
