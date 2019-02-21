import {Store} from 'redux'
import Reverb from 'soundbank-reverb'
import {Master} from 'tone'
import {logger} from './logger'
import {reportLevels} from './redux/audio-redux'
import {IClientAppState, setOptionMasterVolume} from './redux/index'

declare global {
	interface Window {
		AudioContext: any
		webkitAudioContext: any
	}
}

export function setupAudioContext(audioContext: AudioContext, preFx: GainNode, store: Store<IClientAppState>) {
	logger.log('setting up audio context')

	const masterGain = audioContext.createGain()

	const masterFilter = audioContext.createBiquadFilter()
	masterFilter.frequency.value = 10000

	// const reverbHigh = Reverb(audioContext)
	// reverbHigh.time = 0.9
	// reverbHigh.cutoff.value = 5000

	// const reverb = Reverb(audioContext)
	// reverb.time = 3.5
	// reverb.cutoff.value = 2000

	// const reverbLowAndLong = Reverb(audioContext)
	// reverbLowAndLong.time = 20
	// reverbLowAndLong.cutoff.value = 150

	// preFx.connect(reverbHigh)
	// 	.connect(master)
	// preFx.connect(reverb)
	// 	.connect(master)
	// preFx.connect(reverbLowAndLong)
	// 	.connect(master)

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

		if (audioContext.currentTime > 1 && masterLimiter.reduction < -10 && store.getState().options.masterVolume !== 0) {
			store.dispatch(setOptionMasterVolume(0))
			logger.warn(`Feedback loop detected, setting master volume to 0 (masterLimiter.reduction: ${masterLimiter.reduction}`)
		}

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

	const masterLimiter = audioContext.createDynamicsCompressor()
	masterLimiter.threshold.value = -3.0 // this is the pitfall, leave some headroom
	masterLimiter.knee.value = 0.0 // brute force
	masterLimiter.ratio.value = 20.0 // max compression
	masterLimiter.attack.value = 0.000 // 5ms attack
	masterLimiter.release.value = 0.000 // 50ms release
	// limiter.attack.value = 0.005 // 5ms attack
	// limiter.release.value = 0.050 // 50ms release

	const finalNode = preFx.connect(masterGain)
		.connect(masterLimiter)
		.connect(masterFilter)

	finalNode.connect(analyser)
	finalNode.connect(audioContext.destination)

	preFx.gain.value = 0.5

	let previousMasterVolume: number

	store.subscribe(() => {
		const state: IClientAppState = store.getState()
		const newVolume = state.options.masterVolume
		if (previousMasterVolume !== newVolume) {
			// master.gain.value = state.options.masterVolume
			masterGain.gain.value = Math.min(0.5, state.options.masterVolume)
			Master.volume.value = Math.min(0, Math.log(state.options.masterVolume) * 10)
			// console.log('state.options.masterVolume: ', state.options.masterVolume)
			// console.log('tone.js master volume: ', Master.volume.value)
			// limiter.threshold.value = Math.min(-12, state.options.masterVolume)
		}
		previousMasterVolume = newVolume
		// console.log('limiter.reduction: ' + masterLimiter.reduction)
		// console.log('audioContext.currentTime: ' + audioContext.currentTime)
	})

	return audioContext
}
