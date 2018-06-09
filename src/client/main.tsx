import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {hot} from 'react-hot-loader'
import {Provider} from 'react-redux'
import {ConnectedApp} from './app'
import {BasicInstrument} from './BasicInstrument'
import {configureStore, IAppState} from './redux/configureStore'
import {selectPressedMidiNotes} from './redux/midi-redux'
import {setupWebsocket} from './websocket'

const store = configureStore()

window.addEventListener('keydown', e => {
	if (e.repeat) return

	store.dispatch({
		type: 'KEY_DOWN',
		e,
	})
})

window.addEventListener('keyup', e => {
	store.dispatch({
		type: 'KEY_UP',
		e,
	})
})

// Might be needed for safari
// const AudioContext = window.AudioContext || window.webkitAudioContext
const audioContext = new AudioContext()

const onVolume = 0.1

const masterVolume = audioContext.createGain()
masterVolume.connect(audioContext.destination)

const myInstrument = new BasicInstrument({
	destination: masterVolume,
	audioContext,
})
myInstrument.setPan(-1)

const otherClientsInstrument = new BasicInstrument({
	destination: masterVolume,
	audioContext,
})
otherClientsInstrument.setPan(1)

changeMasterVolume(onVolume)

store.subscribe(() => {
	const state: IAppState = store.getState()
	const pressedMidiNotes = selectPressedMidiNotes(state.midi)

	myInstrument.setMidiNotes(pressedMidiNotes)
})

// store.subscribe(() => {
// 	const state: IAppState = store.getState()
// 	const pressedMidiNotes = state.otherClients.forEach(callbackfn)

// 	myInstrument.setMidiNotes(pressedMidiNotes)
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
