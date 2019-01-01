import 'babel-polyfill'
import {selectAllBasicInstrumentIds, selectInstrument} from '../common/redux/basic-instruments-redux'
import {selectAllSamplerIds} from '../common/redux/basic-sampler-redux'
import {addComplexObject, selectComplexObjectById} from '../common/redux/complex-objects-redux'
import {
	selectConnectionSourceNotes, selectConnectionsWithSourceOrTargetIds,
} from '../common/redux/connections-redux'
import {getInitialReduxState} from '../common/redux/initial-client-redux-state'
import {setupAudioContext} from '../common/setup-audio-context'
import {BasicSamplerInstrument} from './BasicSampler/BasicSamplerInstrument'
import {SamplesManager} from './BasicSampler/SamplesManager'
import {configureStore} from './client-store'
import {fpsLoop} from './fps-loop'
import {setupInputEventListeners} from './input-events'
import {BasicInstrument} from './Instruments/BasicInstrument'
import {logClientEnv} from './is-prod-client'
import {renderApp} from './react-main'
import {setupMidiSupport} from './setup-midi-support'
import {setupWebsocketAndListeners, socket} from './websocket-listeners'

declare global {
	interface NodeModule {
		hot: {
			dispose: (_: () => any) => any,
			accept: (_: () => any) => any,
		}
	}
}

setupAsync()

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

	store.subscribe(() => {
		const state = store.getState()

		// Sampler
		const samplerIds = selectAllSamplerIds(state.room)

		samplerIds.forEach(samplerId => {
			const connection = selectConnectionsWithSourceOrTargetIds(state.room, [samplerId])[0]

			if (connection === undefined) return

			const sourceNotes = selectConnectionSourceNotes(state.room, connection.id)
			let sampler: BasicSamplerInstrument = selectComplexObjectById(state, samplerId)

			if (sampler === undefined) {
				sampler = new BasicSamplerInstrument({audioContext, destination: preFx, voiceCount: 20})
				store.dispatch(
					addComplexObject(samplerId, sampler),
				)
			}

			sampler.setMidiNotes(sourceNotes)
		})

		// Basic Instrument
		const basicInstrumentIds = selectAllBasicInstrumentIds(state.room)

		basicInstrumentIds.forEach(basicInstrumentId => {
			const connection = selectConnectionsWithSourceOrTargetIds(state.room, [basicInstrumentId])[0]

			if (connection === undefined) return

			const sourceNotes = selectConnectionSourceNotes(state.room, connection.id)
			let basicInstrument: BasicInstrument = selectComplexObjectById(state, basicInstrumentId)
			const basicInstrumentState = selectInstrument(state.room, basicInstrumentId)

			if (basicInstrument === undefined) {
				basicInstrument = new BasicInstrument({
					audioContext,
					destination: preFx,
					voiceCount: 9,
					oscillatorType: basicInstrumentState.oscillatorType,
				})
				store.dispatch(
					addComplexObject(basicInstrumentId, basicInstrument),
				)
			}

			basicInstrument.setMidiNotes(sourceNotes)
			basicInstrument.setOscillatorType(basicInstrumentState.oscillatorType)
			basicInstrument.setPan(basicInstrumentState.pan)
			basicInstrument.setLowPassFilterCutoffFrequency(basicInstrumentState.lowPassFilterCutoffFrequency)
			basicInstrument.setAttack(basicInstrumentState.attack)
			basicInstrument.setRelease(basicInstrumentState.release)
		})
	})

	renderApp(store)

	fpsLoop()

	if (module.hot) {
		module.hot.dispose(() => {
			socket.disconnect()
			audioContext.close()
		})
	}
}
