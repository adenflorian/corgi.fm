import {Store} from 'redux'
import Reverb from 'soundbank-reverb'
import {setAudioContext, setPreFx} from './redux/audio-redux'
import {IAppState} from './redux/configureStore'

declare global {
	interface Window {
		AudioContext: any
		webkitAudioContext: any
	}
}

export function setupAudioContext(store: Store) {
	// Might be needed for safari
	const AudioContext = window.AudioContext || window.webkitAudioContext
	const audioContext: AudioContext = new AudioContext()

	const preFx = audioContext.createGain()
	const master = audioContext.createGain()

	const reverbHigh = Reverb(audioContext)
	reverbHigh.time = 1
	reverbHigh.cutoff.value = 5000

	const reverb = Reverb(audioContext)
	reverb.time = 5
	reverb.cutoff.value = 2000

	const reverbLowAndLong = Reverb(audioContext)
	reverbLowAndLong.time = 30
	reverbLowAndLong.cutoff.value = 150

	preFx.connect(reverbHigh)
		.connect(master)
	preFx.connect(reverb)
		.connect(master)
	preFx.connect(reverbLowAndLong)
		.connect(master)

	master.connect(audioContext.destination)

	preFx.gain.value = 0.5

	let previousMasterVolume

	store.subscribe(() => {
		const state: IAppState = store.getState()
		const newVolume = state.audio.masterVolume
		if (previousMasterVolume !== newVolume) {
			master.gain.value = state.audio.masterVolume
			window.localStorage.masterVolume = state.audio.masterVolume
		}
		previousMasterVolume = newVolume
	})

	store.dispatch(setAudioContext(audioContext))
	store.dispatch(setPreFx(preFx))

	if (module.hot) {
		module.hot.dispose(() => {
			audioContext.close()
		})
	}
}
