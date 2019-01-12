import {Store} from 'redux'
import Reverb from 'soundbank-reverb'
import {logger} from './logger'
import {reportLevels} from './redux/audio-redux'
import {IClientAppState} from './redux/common-redux-types'

declare global {
	interface Window {
		AudioContext: any
		webkitAudioContext: any
	}
}

export function setupAudioContext(audioContext: AudioContext, preFx: GainNode, store: Store) {
	logger.log('setting up audio context')

	const master = audioContext.createGain()

	const reverbHigh = Reverb(audioContext)
	reverbHigh.time = 0.9
	reverbHigh.cutoff.value = 5000

	const reverb = Reverb(audioContext)
	reverb.time = 3.5
	reverb.cutoff.value = 2000

	const reverbLowAndLong = Reverb(audioContext)
	reverbLowAndLong.time = 20
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

	const updateInterval = 250
	let lastUpdateTime = Date.now()

	let lastReportedValue = -999
	const deltaThreshold = 0.5

	javascriptNode.onaudioprocess = checkAudioLevels

	function checkAudioLevels() {
		const timeSinceLastUpdate = Date.now() - lastUpdateTime

		if (timeSinceLastUpdate >= updateInterval) {
			const array = new Uint8Array(analyser.frequencyBinCount)
			analyser.getByteFrequencyData(array)
			const average = sumArray(array) / array.length
			if (Math.abs(average - lastReportedValue) > deltaThreshold) {
				store.dispatch(reportLevels(average))
				// store.dispatch(reportLevels(arrayMax(array) - 128))
				// logger.log('array: ', array)
				lastReportedValue = average
			}
			lastUpdateTime = Date.now()
		}
	}

	function sumArray(arr: Uint8Array) {
		return arr.reduce((sum, num) => {
			return sum + num
		})
	}

	master.connect(audioContext.destination)
	master.connect(analyser)

	preFx.gain.value = 0.5

	let previousMasterVolume: number

	store.subscribe(() => {
		const state: IClientAppState = store.getState()
		const newVolume = state.options.masterVolume
		if (previousMasterVolume !== newVolume) {
			master.gain.value = state.options.masterVolume
		}
		previousMasterVolume = newVolume
	})

	return audioContext
}
