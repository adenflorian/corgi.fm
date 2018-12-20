import {selectAllSamplerIds} from '../common/redux/basic-sampler-redux'
import {addComplexObject, selectComplexObjectById} from '../common/redux/complex-objects-redux'
import {
	selectConnectionSourceNotes, selectConnectionsWithSourceOrTargetIds, selectSourceByConnectionId,
} from '../common/redux/connections-redux'
import {getInitialReduxState} from '../common/redux/initial-client-redux-state'
import {audioContext, setupAudioContext} from '../common/setup-audio-context'
import {BasicSamplerInstrument} from './BasicSampler/BasicSamplerInstrument'
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

store.subscribe(() => {
	const state = store.getState()

	const samplerIds = selectAllSamplerIds(state.room)

	samplerIds.forEach(samplerId => {
		const connection = selectConnectionsWithSourceOrTargetIds(state.room, [samplerId])[0]

		if (connection === undefined) return

		const sourceNotes = selectConnectionSourceNotes(state.room, connection.id)
		let sampler: BasicSamplerInstrument = selectComplexObjectById(state, samplerId)

		if (sampler === undefined) {
			sampler = new BasicSamplerInstrument({audioContext, destination: audioContext.destination})
			store.dispatch(
				addComplexObject(samplerId, sampler),
			)
		}

		sampler.setMidiNotes(sourceNotes)
	})
})

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
