import {logger} from '../common/logger'
import {IMidiNote} from '../common/MidiNote'
import {midiNoteToFrequency} from './WebAudio/music-functions'

let ctx: AudioContext
let preFx: GainNode

export function loadExperiment() {
	console.log('loadExperiment')

	const AudioContext = window.AudioContext || window.webkitAudioContext
	ctx = new AudioContext()
	preFx = ctx.createGain()
	preFx.gain.value = 0.1
	preFx.connect(ctx.destination)

	startMainLoop()

	// playNote(60, 0)
	// playNote(61, 0.5)
	// playNote(62, 1.5)
	// playNote(64, 3)

	if (module.hot) {
		module.hot.dispose(() => {
			preFx.disconnect()
			stop = true
		})
	}
}

// const melody = [65, 67, 72, 69, 0, 69, 74, 0]
const melody = [60, 61, 62, 63, 64, 65, 66, 67]
let melodyIndex = 0

const bass = [53, 0, 0, 0, 0, 0, 0, 0, 50, 0, 0, 0, 0, 0, 0, 0]
let bassIndex = 0

interface Note {
	startBeat: number,
	note: number
}

const fancy = {
	length: 2 * 1000,
	events: [
		{
			startBeat: 0 / 16 * 1000,
			note: 60,
		},
		{
			startBeat: 1 / 16 * 1000,
			note: 59,
		},
		{
			startBeat: 2 / 16 * 1000,
			note: 60,
		},
		{
			startBeat: 3 / 16 * 1000,
			note: 57,
		},
		{
			startBeat: 1 * 1000,
			note: 61,
		},
		{
			startBeat: 1.5 * 1000,
			note: 62,
		},
		{
			startBeat: 1.75 * 1000,
			note: 63,
		},
		{
			startBeat: 2 * 1000,
			note: 65,
		},
		{
			startBeat: 2 * 1000,
			note: 69,
		},
		{
			startBeat: 3 * 1000,
			note: 72,
		},
		{
			startBeat: 3 * 1000,
			note: 68,
		},
		{
			startBeat: 4 * 1000,
			note: 69,
		},
		{
			startBeat: 4 * 1000,
			note: 73,
		},
		{
			startBeat: 4 * 1000,
			note: 76,
		},
		{
			startBeat: 6 * 1000,
			note: 56,
		},
		{
			startBeat: 6 * 1000,
			note: 60,
		},
		{
			startBeat: 6 * 1000,
			note: 63,
		},
	] as Note[],
}

const bpm = 240
const threshold = (1000 * 60) / bpm

let elapsedTimeMs: number
let startTimeMs: number
let lastTimeMs: number

let stop = false
let flag = false

function startMainLoop() {
	elapsedTimeMs = 0
	startTimeMs = performance.now()
	lastTimeMs = startTimeMs
	console.log('currentBeat: ', currentBeat)

	const beginRange = currentBeat
	const endRange = currentBeat + lookAheadBeats + lookAheadRangeBeats
	lastBeatChecked = endRange

	fancy.events.forEach(({startBeat, note}) => {
		console.log('startBeat: ', startBeat)
		if (startBeat >= beginRange && startBeat <= endRange) {
			const delay = (startBeat - currentBeat) * (60 / bpm)
			playNote2(note, delay)
			logger.log({currentBeat, lastBeatChecked, note, delay, startBeat, bpm})
		}
	})

	mainLoop(startTimeMs)
}

let lastBeat = 0
let currentBeat = 0
let elapsedBeats = 0
let lastBeatChecked = 0

const lookAheadSec = 0.1
const lookAheadMs = lookAheadSec * 1000
const lookAheadBeats = lookAheadMs * (bpm / 60)
const lookAheadRangeSec = 1
const lookAheadRangeBeats = lookAheadRangeSec * 1000

function mainLoop(time: number) {
	if (stop) return

	const deltaTime = time - lastTimeMs

	lastTimeMs = time

	elapsedTimeMs += deltaTime

	if (elapsedTimeMs > threshold) {
		elapsedTimeMs -= threshold

		// playNote(flag ? 55 : 57)
		flag = !flag

		// playNote(melody[melodyIndex] + 0, 0.1)
		melodyIndex++

		if (melodyIndex === melody.length) melodyIndex = 0

		// playNote(bass[bassIndex] + 0, 2)
		bassIndex++

		if (bassIndex === bass.length) bassIndex = 0
	}

	// console.log(elapsedTime)

	currentBeat += deltaTime * (bpm / 60)
	elapsedBeats += deltaTime * (bpm / 60)

	// look behind
	// if (beatIndex > fancy.length) {
	// 	beatIndex -= fancy.length

	// 	fancy.events.forEach(({startBeat, note}) => {
	// 		if (startBeat > lastBeatIndex && startBeat < fancy.length) {
	// 			playNote2(note)
	// 		}
	// 		if (startBeat >= 0 && startBeat <= beatIndex) {
	// 			playNote2(note)
	// 		}
	// 	})
	// } else {
	// 	fancy.events.filter(({startBeat}) => startBeat > lastBeatIndex && startBeat <= beatIndex).forEach(x => {
	// 		playNote2(x.note, (x.startBeat - lastBeatIndex) / 1000)
	// 		console.log(x.note)
	// 	})
	// }

	// look ahead
	// if (currentBeat > fancy.length) {
	// 	currentBeat -= fancy.length

	// 	// fancy.events.forEach(({startBeat, note}) => {
	// 	// 	if (startBeat > lastBeat && startBeat < fancy.length) {
	// 	// 		// playNote2(note)
	// 	// 	}
	// 	// 	if (startBeat >= 0 && startBeat <= currentBeat) {
	// 	// 		// playNote2(note)
	// 	// 	}
	// 	// })
	// } else {
	if (elapsedBeats > lookAheadRangeBeats) {
		elapsedBeats -= lookAheadRangeBeats

		const beginRange = lastBeatChecked
		const endRange = lastBeatChecked + lookAheadRangeBeats
		lastBeatChecked = endRange
		logger.log({currentBeat, lastBeatChecked})

		fancy.events.forEach(({startBeat, note}) => {
			if (startBeat > beginRange && startBeat <= endRange) {
				const delay = (startBeat - currentBeat) * (60 / bpm)
				playNote2(note, delay)
				logger.log({currentBeat, lastBeatChecked, note, delay, startBeat})
			}
		})
	}
	// }

	lastBeat = currentBeat

	// if (beatIndex > 1900) console.log(beatIndex)

	// let xx = 0

	// while (xx < 200000000) {
	// 	xx++
	// }

	requestAnimationFrame(mainLoop)
}

// const gains = Array<GainNode>()

function playNote(note: IMidiNote, startDelayMs = 0) {

	const attack = 0.01
	const release = 1

	const oscA = ctx.createOscillator()
	oscA.start()
	oscA.frequency.setValueAtTime(midiNoteToFrequency(note), ctx.currentTime)

	let gain: GainNode

	// if (gains.length > 0) {
	// 	gain = gains.shift()!
	// } else {
	gain = ctx.createGain()
	// }
	// console.log(startDelay)

	// gain.gain.cancelAndHoldAtTime(ctx.currentTime)
	gain.gain.linearRampToValueAtTime(0, ctx.currentTime)
	gain.gain.linearRampToValueAtTime(1, ctx.currentTime + attack)
	// gain.gain.value = 1
	gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + attack + release)

	oscA.connect(gain)
		.connect(preFx)

	if (module.hot) {
		module.hot.dispose(dispose)
	}

	setTimeout(dispose, release * 1000)

	function dispose() {
		oscA.stop()
		oscA.disconnect()
		gain.disconnect()
		// gains.push(gain)
	}
}

function playNote2(note: IMidiNote, startDelayMs: number = 0) {
	const startDelaySec = startDelayMs / 1000

	const attack = 0.01
	const release = 1

	const oscA = ctx.createOscillator()
	oscA.start(ctx.currentTime + startDelaySec)
	oscA.stop(ctx.currentTime + startDelaySec + attack + release)
	oscA.frequency.setValueAtTime(midiNoteToFrequency(note), ctx.currentTime)

	let gain: GainNode

	// if (gains.length > 0) {
	// 	gain = gains.shift()!
	// } else {
	gain = ctx.createGain()
	// }
	console.log(startDelaySec)

	// gain.gain.cancelAndHoldAtTime(ctx.currentTime)
	gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startDelaySec)
	gain.gain.linearRampToValueAtTime(1, ctx.currentTime + startDelaySec + attack)
	// gain.gain.value = 1
	gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + startDelaySec + attack + release)

	oscA.connect(gain)
		.connect(preFx)

	if (module.hot) {
		module.hot.dispose(dispose)
	}

	// setTimeout(dispose, release * 1000)

	function dispose() {
		oscA.stop()
		oscA.disconnect()
		gain.disconnect()
		// gains.push(gain)
	}
}
