import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {hot} from 'react-hot-loader'
import {Provider} from 'react-redux'
import Reverb from 'soundbank-reverb'
import {ConnectedApp} from './App'
import {setupInputEventListeners} from './input-events'
import {configureStore} from './redux/configureStore'
import {setupWebsocket} from './websocket'

// Might be needed for safari
// const AudioContext = window.AudioContext || window.webkitAudioContext
const audioContext = new AudioContext()

const masterVolume = audioContext.createGain()

const store = configureStore({
	audio: {
		context: audioContext,
		master: masterVolume,
	},
})

setupInputEventListeners(window, store)

const onVolume = 0.1

const reverb = Reverb(audioContext)
reverb.time = 5
reverb.cutoff.value = 1000

const reverbLowAndLong = Reverb(audioContext)
reverbLowAndLong.time = 30
reverbLowAndLong.cutoff.value = 150

masterVolume.connect(reverb)
reverb.connect(reverbLowAndLong)
reverbLowAndLong.connect(audioContext.destination)

changeMasterVolume(onVolume)

function changeMasterVolume(newGain: number) {
	masterVolume.gain.value = newGain
}

const socket = setupWebsocket(store)

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
