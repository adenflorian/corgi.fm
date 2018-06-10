import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {hot} from 'react-hot-loader'
import {Provider} from 'react-redux'
import Reverb from 'soundbank-reverb'
import {ConnectedApp} from './App'
import {BasicInstrument} from './BasicInstrument'
import {setupInputEventListeners} from './input-events'
import {configureStore, IAppState} from './redux/configureStore'
import {selectPressedMidiNotes} from './redux/midi-redux'
import {setupWebsocket} from './websocket'

const store = configureStore()

setupInputEventListeners(window, store)

// Might be needed for safari
// const AudioContext = window.AudioContext || window.webkitAudioContext
const audioContext = new AudioContext()

const onVolume = 0.1

const reverb = Reverb(audioContext)
reverb.time = 5
reverb.cutoff.value = 1000

const masterVolume = audioContext.createGain()

masterVolume.connect(reverb)
	.connect(audioContext.destination)

const myInstrument = new BasicInstrument({
	destination: masterVolume,
	audioContext,
})
myInstrument.setPan(-0.5)

const otherClientsInstrument = new BasicInstrument({
	destination: masterVolume,
	audioContext,
})
otherClientsInstrument.setPan(0.5)

changeMasterVolume(onVolume)

store.subscribe(() => {
	const state: IAppState = store.getState()
	const pressedMidiNotes = selectPressedMidiNotes(state.midi)

	myInstrument.setMidiNotes(pressedMidiNotes)
})

// store.subscribe(() => {
// 	const state: IAppState = store.getState()
// 	const pressedMidiNotes = state.otherClients.forEach(callbackfn)

// 	otherClientsInstrument.setMidiNotes(pressedMidiNotes)
// })

/** @param {number} newFrequency */
function changeMasterVolume(newGain) {
	masterVolume.gain.value = newGain
}

const socket = setupWebsocket(store, otherClientsInstrument)

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
	})
}

renderApp()

module.hot.accept(renderApp)

function renderApp() {
	const HotProvider = hot(module)(Provider)
	ReactDOM.render(
		<HotProvider store={store}>
			<ConnectedApp />
		</HotProvider>,
		document.getElementById('react-app'),
	)
}
