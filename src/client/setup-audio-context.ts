import {Store} from 'redux'
import Reverb from 'soundbank-reverb'
import {reportLevels, setAudioContext, setPreFx} from '../common/redux/audio-redux'
import {IAppState} from '../common/redux/configureStore'

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

	const analyser = audioContext.createAnalyser()
	analyser.smoothingTimeConstant = 0.3
	analyser.fftSize = 1024

	const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1)

	javascriptNode.connect(audioContext.destination)

	javascriptNode.onaudioprocess = () => {
		const array = new Uint8Array(analyser.frequencyBinCount)
		analyser.getByteFrequencyData(array)
		const average = sumArray(array) / array.length

		store.dispatch(reportLevels(average))
	}

	function sumArray(arr) {
		return arr.reduce((sum, num) => {
			return sum + num
		})
	}

	master.connect(audioContext.destination)
	master.connect(analyser)

	preFx.gain.value = 0.5

	let previousMasterVolume

	store.subscribe(() => {
		const state: IAppState = store.getState()
		const newVolume = state.options.masterVolume
		if (previousMasterVolume !== newVolume) {
			master.gain.value = state.options.masterVolume
		}
		previousMasterVolume = newVolume
	})

	store.dispatch(setAudioContext(audioContext))
	store.dispatch(setPreFx(preFx))
}
