import {List, Set} from 'immutable'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {createThisShouldntHappenError} from '../common/common-utils'
import {logger} from '../common/logger'
import {makeMidiClipEvent, MidiClip} from '../common/midi-types'
import {IMidiNotes} from '../common/MidiNote'
import {midiNoteToFrequency} from './WebAudio/music-functions'

let ctx: AudioContext
let preFx: GainNode

export function loadExperiment() {
	logger.log('loadExperiment')

	const AudioContext = window.AudioContext || window.webkitAudioContext
	ctx = new AudioContext()
	preFx = ctx.createGain()
	preFx.gain.value = 0.1
	preFx.connect(ctx.destination)

	if (ctx.state === 'running') {
		startMainLoop()
		ReactDOM.render(
			<p>starting automatically because context did not get paused</p>,
			document.getElementById('react-app'),
		)
	} else {
		ReactDOM.render(
			<Experiment />,
			document.getElementById('react-app'),
		)
	}

	if (module.hot) {
		module.hot.dispose(() => {
			preFx.disconnect()
			stop = true
		})
	}
}

class Experiment extends React.PureComponent {
	public render() {
		return (
			<button
				onClick={() => {
					ctx.resume()
					startMainLoop()
				}}
			>
				start
			</button>
		)
	}
}

const longDemoMidiClip = new MidiClip({
	length: 2 * 1000,
	loop: false,
	events: List([
		makeMidiClipEvent({
			startBeat: 0,
			durationBeats: 1 / 8 * 1000,
			notes: Set([60]),
		}),
		makeMidiClipEvent({
			startBeat: 1 / 4 * 1000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 2 / 4 * 1000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 3 / 4 * 1000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 4 / 4 * 1000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([72]),
		}),
		makeMidiClipEvent({
			startBeat: 5 / 4 * 1000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 6 / 4 * 1000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 7 / 4 * 1000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 0 + 2000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([60]),
		}),
		makeMidiClipEvent({
			startBeat: 1 / 8 * 1000 + 2000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 2 / 8 * 1000 + 2000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 3 / 8 * 1000 + 2000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 4 / 8 * 1000 + 2000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([72]),
		}),
		makeMidiClipEvent({
			startBeat: 5 / 8 * 1000 + 2000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 6 / 8 * 1000 + 2000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 7 / 8 * 1000 + 2000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 0 + 3000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([60]),
		}),
		makeMidiClipEvent({
			startBeat: 1 / 8 * 1000 + 3000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 2 / 8 * 1000 + 3000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 3 / 8 * 1000 + 3000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 4 / 8 * 1000 + 3000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([72]),
		}),
		makeMidiClipEvent({
			startBeat: 5 / 8 * 1000 + 3000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 6 / 8 * 1000 + 3000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 7 / 8 * 1000 + 3000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 0 / 16 * 1000 + 4000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([60]),
		}),
		makeMidiClipEvent({
			startBeat: 1 / 16 * 1000 + 4000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 2 / 16 * 1000 + 4000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 3 / 16 * 1000 + 4000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 4 / 16 * 1000 + 4000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([72]),
		}),
		makeMidiClipEvent({
			startBeat: 5 / 16 * 1000 + 4000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 6 / 16 * 1000 + 4000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 7 / 16 * 1000 + 4000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 8 / 16 * 1000 + 4000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([60]),
		}),
		makeMidiClipEvent({
			startBeat: 9 / 16 * 1000 + 4000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 10 / 16 * 1000 + 4000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 11 / 16 * 1000 + 4000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 12 / 16 * 1000 + 4000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([72]),
		}),
		makeMidiClipEvent({
			startBeat: 13 / 16 * 1000 + 4000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 14 / 16 * 1000 + 4000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 15 / 16 * 1000 + 4000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([64]),
		}),

		makeMidiClipEvent({
			startBeat: 0 / 3 * 1000 + 6000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 0 / 3 * 1000 + 6000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 0 / 3 * 1000 + 6000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([64]),
		}),

		makeMidiClipEvent({
			startBeat: 1 / 3 * 1000 + 6000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 1 / 3 * 1000 + 6000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 1 / 3 * 1000 + 6000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([64]),
		}),

		makeMidiClipEvent({
			startBeat: 2 / 3 * 1000 + 6000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 2 / 3 * 1000 + 6000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 2 / 3 * 1000 + 6000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([64]),
		}),

		makeMidiClipEvent({
			startBeat: 0 / 3 * 1000 + 7000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([74]),
		}),
		makeMidiClipEvent({
			startBeat: 0 / 3 * 1000 + 7000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([70]),
		}),
		makeMidiClipEvent({
			startBeat: 0 / 3 * 1000 + 7000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([67]),
		}),
	]),
})

const shortLoopedMidiClip = new MidiClip({
	length: 2 * 1000,
	loop: true,
	events: List([
		makeMidiClipEvent({
			startBeat: 0,
			durationBeats: 1 / 8 * 1000,
			notes: Set([60]),
		}),
		makeMidiClipEvent({
			startBeat: 1 / 4 * 1000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([64]),
		}),
		makeMidiClipEvent({
			startBeat: 2 / 4 * 1000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 3 / 4 * 1000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 4 / 4 * 1000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([72]),
		}),
		makeMidiClipEvent({
			startBeat: 5 / 4 * 1000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([71]),
		}),
		makeMidiClipEvent({
			startBeat: 6 / 4 * 1000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([67]),
		}),
		makeMidiClipEvent({
			startBeat: 7 / 4 * 1000,
			durationBeats: 1 / 8 * 1000,
			notes: Set([64]),
		}),
	]),
})

// const song = longDemoSong
const midiClip: MidiClip = shortLoopedMidiClip

const bpm = 60

let startTimeMs: number
let lastTimeMs: number

let stop = false
let started = false

function startMainLoop() {

	return logger.warn('disabled')

	if (started) return
	started = true
	startTimeMs = performance.now()
	lastTimeMs = startTimeMs

	const startRangeBeat = currentBeat
	const endRangeBeat = currentBeat + lookAheadBeats + lookAheadRangeBeats

	logger.log(`START | currentBeat: ${currentBeat} | checking beats: ${startRangeBeat} <= beat < ${endRangeBeat} `)

	midiClip.events.forEach(({startBeat, notes}, key) => {
		if (startBeat >= startRangeBeat && startBeat < endRangeBeat) {
			const delay = getDelayMs(startBeat, currentBeat, midiClip.length, bpm)
			logger.log(`  PLAY NOTE0 ${key}: `, {currentBeat, lastBeatChecked, notes, delay, startBeat})
			playNote2(notes, delay)
		}
	})

	lastBeatChecked = endRangeBeat

	mainLoop(startTimeMs)
}

let lastBeat = 0
let currentBeat = 0
let elapsedBeats = 0
let lastBeatChecked = 0
let loops = 0

const lookAheadSec = 0.11
const lookAheadMs = lookAheadSec * 1000
const lookAheadBeats = lookAheadMs * (bpm / 60)
const lookAheadRangeSec = 1.519
const lookAheadRangeMs = lookAheadRangeSec * 1000
const lookAheadRangeBeats = lookAheadRangeMs * (bpm / 60)

logger.log({lookAheadSec, lookAheadMs, lookAheadBeats})
logger.log({lookAheadRangeSec, lookAheadRangeMs, lookAheadRangeBeats})

// range should probably always be smaller than look ahead

function mainLoop(time: number) {
	if (stop) return

	const deltaTime = time - lastTimeMs

	lastTimeMs = time

	const deltaBeats = deltaTime * (bpm / 60)

	currentBeat += deltaBeats
	elapsedBeats += deltaBeats

	if (currentBeat >= midiClip.length) {
		currentBeat -= midiClip.length
	}

	if (elapsedBeats > lookAheadRangeBeats) {
		elapsedBeats -= lookAheadRangeBeats

		const startRangeBeat = lastBeatChecked
		const endRangeBeat = lastBeatChecked + lookAheadRangeBeats

		if (endRangeBeat <= midiClip.length) {
			logger.log(`NORMAL | currentBeat: ${currentBeat} | checking beats: ${startRangeBeat} <= beat < ${endRangeBeat} `)

			if (startRangeBeat === midiClip.length) throw createThisShouldntHappenError()

			midiClip.events.forEach(({startBeat, notes: note}, key) => {
				if (startRangeBeat <= startBeat && startBeat < endRangeBeat) {
					const delay = getDelayMs(startBeat, currentBeat, midiClip.length, bpm)
					logger.log(`  PLAY NOTE1 ${key}: `, {currentBeat, lastBeatChecked, note, delay, startBeat})
					if (delay <= 0) throw new Error('delay <= 0')
					playNote2(note, delay)
				}
			})
			lastBeatChecked = endRangeBeat
		} else if (endRangeBeat > midiClip.length) {
			if (startRangeBeat > midiClip.length) throw createThisShouldntHappenError()

			const startRangeBeat1 = lastBeatChecked
			const endRangeBeat1 = midiClip.length

			const startRangeBeat2 = 0
			const endRangeBeat2 = lookAheadRangeBeats - (midiClip.length - lastBeatChecked)

			logger.log(`LOOP | currentBeat: ${currentBeat} | checking beats: ${startRangeBeat1} <= beat < ${endRangeBeat1} &  ${startRangeBeat2} <= beat < ${endRangeBeat2}`)

			midiClip.events.forEach(({startBeat, notes: note}, key) => {
				if (startRangeBeat1 <= startBeat && startBeat < endRangeBeat1) {
					const delay = getDelayMs(startBeat, currentBeat, midiClip.length, bpm)
					logger.log(`  PLAY NOTE2 ${key}: `, {currentBeat, lastBeatChecked, note, delay, startBeat})
					if (delay <= 0) throw new Error('delay <= 0')
					playNote2(note, delay)
				}
			})

			// TODO Deal with loop which is smaller than look ahead range

			midiClip.events.forEach(({startBeat, notes: note}, key) => {
				if (startRangeBeat2 <= startBeat && startBeat < endRangeBeat2) {
					const delay = getDelayMs(startBeat, currentBeat, midiClip.length, bpm)
					logger.log(`  PLAY NOTE3 ${key}: `, {currentBeat, lastBeatChecked, note, delay, startBeat})
					if (delay <= 0) throw new Error('delay <= 0')
					playNote2(note, delay)
				}
			})

			lastBeatChecked = endRangeBeat - midiClip.length
			loops++
			if (loops > 1) throw new Error('stop')
		} else {
			throw createThisShouldntHappenError()
		}
	}

	lastBeat = currentBeat

	// if (beatIndex > 1900) logger.log(beatIndex)

	// let xx = 0

	// for testing under load
	// while (xx < 2000000000) {
	// 	xx++
	// }

	requestAnimationFrame(mainLoop)
}

function getDelayMs(startBeat: number, currentBeatA: number, clipLength: number, bpmA: number) {
	if (startBeat > currentBeatA) {
		return (startBeat - currentBeatA) * (60 / bpmA)
	} else if (startBeat === currentBeatA) {
		return 0
	} else if (startBeat < currentBeatA) {
		return (startBeat - (currentBeatA - clipLength)) * (60 / bpmA)
	} else {
		throw createThisShouldntHappenError()
	}
}

// const gains = Array<GainNode>()

function playNote(notes: IMidiNotes, startDelayMs = 0) {
	if (startDelayMs <= 0) logger.warn('delay <= 0: ', startDelayMs)

	const attack = 0.01
	const release = 1

	const oscA = ctx.createOscillator()
	oscA.start()
	oscA.frequency.setValueAtTime(midiNoteToFrequency(notes.first()), ctx.currentTime)

	let gain: GainNode

	// if (gains.length > 0) {
	// 	gain = gains.shift()!
	// } else {
	gain = ctx.createGain()
	// }
	// logger.log(startDelay)

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

function playNote2(notes: IMidiNotes, startDelayMs: number = 0) {
	if (startDelayMs <= 0) logger.warn('startDelayMs <= 0 | ', startDelayMs)
	const startDelaySec = startDelayMs / 1000

	const actualNote = notes.first(0)

	const attack = 0.01
	const release = 1

	const oscA = ctx.createOscillator()
	oscA.start(ctx.currentTime + startDelaySec)
	oscA.stop(ctx.currentTime + startDelaySec + attack + release)
	oscA.frequency.setValueAtTime(midiNoteToFrequency(actualNote), ctx.currentTime)

	let gain: GainNode

	// if (gains.length > 0) {
	// 	gain = gains.shift()!
	// } else {
	gain = ctx.createGain()
	// }
	logger.log(startDelaySec)

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
