import {Store} from 'redux'
import {logger} from './logger'
import {IClientAppState} from './redux/index'

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
	masterFilter.frequency.value = 20000

	const analyser = audioContext.createAnalyser()
	analyser.smoothingTimeConstant = 0.3
	analyser.fftSize = 1024

	const masterLimiter = audioContext.createDynamicsCompressor()
	masterLimiter.threshold.value = -3.0 // this is the pitfall, leave some headroom
	masterLimiter.knee.value = 0.0 // brute force
	masterLimiter.ratio.value = 20.0 // max compression
	masterLimiter.attack.value = 0.005 // 5ms attack
	masterLimiter.release.value = 0.050 // 50ms release
	// limiter.attack.value = 0.005 // 5ms attack
	// limiter.release.value = 0.050 // 50ms release

	const finalNode = preFx
		.connect(masterLimiter)
		.connect(masterFilter)
		.connect(masterGain)

	finalNode.connect(analyser)
	finalNode.connect(audioContext.destination)

	preFx.gain.value = 0.5

	let previousMasterVolume: number
	let previousMasterVolumeMuted: boolean

	store.subscribe(() => {
		const state: IClientAppState = store.getState()
		const newVolume = state.options.masterVolume
		const newMuted = state.options.masterVolumeMute
		if (previousMasterVolume !== newVolume) {
			// master.gain.value = state.options.masterVolume
			masterGain.gain.value = Math.min(0.5, state.options.masterVolume)
			// console.log('Master: ', Master)
			// Master.volume.value = Math.min(0, Math.log(state.options.masterVolume) * 10)
			// console.log('state.options.masterVolume: ', state.options.masterVolume)
			// console.log('tone.js master volume: ', Master.volume.value)
			// limiter.threshold.value = Math.min(-12, state.options.masterVolume)
			previousMasterVolume = newVolume
		}
		if (previousMasterVolumeMuted !== newMuted) {
			if (newMuted) {
				masterGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1)
			} else {
				masterGain.gain.linearRampToValueAtTime(previousMasterVolume, audioContext.currentTime + 0.1)
			}

			previousMasterVolumeMuted = newMuted
		}
		// console.log('limiter.reduction: ' + masterLimiter.reduction)
		// console.log('audioContext.currentTime: ' + audioContext.currentTime)
	})

	// For manual testing of web audio scheduling
	// const oscGain = audioContext.createGain()
	// oscGain.gain.value = 0

	// const oscA = audioContext.createOscillator()
	// oscA.type = 'sawtooth'
	// oscA.connect(oscGain).connect(preFx)
	// oscA.start(2)

	// // before attack
	// oscGain.gain.linearRampToValueAtTime(0, 2)

	// const sustain = 1

	// // attack
	// oscGain.gain.linearRampToValueAtTime(sustain, 12)

	// // // sustain
	// // oscGain.gain.linearRampToValueAtTime(sustain, 12)

	// // // release
	// // oscGain.gain.linearRampToValueAtTime(0, 14)

	// // change attack twice
	// oscGain.gain.cancelAndHoldAtTime(4)
	// oscGain.gain.linearRampToValueAtTime(sustain, 5.5)
	// oscGain.gain.cancelAndHoldAtTime(5)
	// oscGain.gain.linearRampToValueAtTime(sustain, 7)

	// // sustain
	// oscGain.gain.linearRampToValueAtTime(sustain, 8)

	// // release
	// oscGain.gain.linearRampToValueAtTime(0, 9)

	// // window.addEventListener('keydown', e => {
	// // 	if (e.key === 'v') {

	// // 		oscGain.gain.cancelAndHoldAtTime(audioContext.currentTime)
	// // 		oscGain.gain.linearRampToValueAtTime(sustain, audioContext.currentTime + 1)

	// // 		// sustain
	// // 		oscGain.gain.linearRampToValueAtTime(sustain, audioContext.currentTime + 2)

	// // 		// release
	// // 		oscGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 3)
	// // 	}
	// // })

	// // oscA.frequency.setValueAtTime(440, audioContext.currentTime)

	// // let done = false

	// setInterval(() => {
	// 	// if (done === false && audioContext.currentTime > 4) {
	// 	// 	oscA.frequency.linearRampToValueAtTime(880, 3)
	// 	// 	oscA.frequency.linearRampToValueAtTime(440, 5)
	// 	// 	done = true
	// 	// }
	// 	// console.log('oscA.frequency.value: ', oscA.frequency.value)
	// 	if (audioContext.currentTime > 10) return
	// 	console.log('audioContext.currentTime: ', audioContext.currentTime)
	// 	console.log('oscGain.gain.value: ', oscGain.gain.value)
	// }, 100)

	// // setTimeout(() => {
	// // 	// oscGain.gain.linearRampToValueAtTime(0, 2)
	// // }, 5000)

	// const waveArray = new Float32Array(5)
	// waveArray[0] = 440
	// waveArray[1] = 880
	// waveArray[2] = 440
	// waveArray[3] = 880
	// waveArray[4] = 440

	// oscA.frequency.setValueCurveAtTime(waveArray, audioContext.currentTime + 4, 4)

	// oscGain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 8)
	// oscGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 10)

	return {
		audioContext,
		masterLimiter,
	}
}
