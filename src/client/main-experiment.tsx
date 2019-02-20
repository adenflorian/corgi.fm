import {List, Record} from 'immutable'
import {isEqual} from 'lodash'
import React = require('react')
import ReactDOM = require('react-dom')
import {logger} from '../common/logger'
import {IMidiNote} from '../common/MidiNote'
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

interface MidiEvent {
	startBeat: number,
	note: number
}

const makeMidiClip = Record({
	length: 4,
	loop: true,
	events: List<MidiEvent>(),
})

type MidiEvents = MidiClip['events']

type MidiClip = ReturnType<typeof makeMidiClip>

const longDemoMidiClip = makeMidiClip({
	length: 2 * 1000,
	loop: false,
	events: List([
		{
			startBeat: 0,
			note: 60,
		},
		{
			startBeat: 1 / 4 * 1000,
			note: 64,
		},
		{
			startBeat: 2 / 4 * 1000,
			note: 67,
		},
		{
			startBeat: 3 / 4 * 1000,
			note: 71,
		},
		{
			startBeat: 4 / 4 * 1000,
			note: 72,
		},
		{
			startBeat: 5 / 4 * 1000,
			note: 71,
		},
		{
			startBeat: 6 / 4 * 1000,
			note: 67,
		},
		{
			startBeat: 7 / 4 * 1000,
			note: 64,
		},
		{
			startBeat: 0 + 2000,
			note: 60,
		},
		{
			startBeat: 1 / 8 * 1000 + 2000,
			note: 64,
		},
		{
			startBeat: 2 / 8 * 1000 + 2000,
			note: 67,
		},
		{
			startBeat: 3 / 8 * 1000 + 2000,
			note: 71,
		},
		{
			startBeat: 4 / 8 * 1000 + 2000,
			note: 72,
		},
		{
			startBeat: 5 / 8 * 1000 + 2000,
			note: 71,
		},
		{
			startBeat: 6 / 8 * 1000 + 2000,
			note: 67,
		},
		{
			startBeat: 7 / 8 * 1000 + 2000,
			note: 64,
		},
		{
			startBeat: 0 + 3000,
			note: 60,
		},
		{
			startBeat: 1 / 8 * 1000 + 3000,
			note: 64,
		},
		{
			startBeat: 2 / 8 * 1000 + 3000,
			note: 67,
		},
		{
			startBeat: 3 / 8 * 1000 + 3000,
			note: 71,
		},
		{
			startBeat: 4 / 8 * 1000 + 3000,
			note: 72,
		},
		{
			startBeat: 5 / 8 * 1000 + 3000,
			note: 71,
		},
		{
			startBeat: 6 / 8 * 1000 + 3000,
			note: 67,
		},
		{
			startBeat: 7 / 8 * 1000 + 3000,
			note: 64,
		},
		{
			startBeat: 0 / 16 * 1000 + 4000,
			note: 60,
		},
		{
			startBeat: 1 / 16 * 1000 + 4000,
			note: 64,
		},
		{
			startBeat: 2 / 16 * 1000 + 4000,
			note: 67,
		},
		{
			startBeat: 3 / 16 * 1000 + 4000,
			note: 71,
		},
		{
			startBeat: 4 / 16 * 1000 + 4000,
			note: 72,
		},
		{
			startBeat: 5 / 16 * 1000 + 4000,
			note: 71,
		},
		{
			startBeat: 6 / 16 * 1000 + 4000,
			note: 67,
		},
		{
			startBeat: 7 / 16 * 1000 + 4000,
			note: 64,
		},
		{
			startBeat: 8 / 16 * 1000 + 4000,
			note: 60,
		},
		{
			startBeat: 9 / 16 * 1000 + 4000,
			note: 64,
		},
		{
			startBeat: 10 / 16 * 1000 + 4000,
			note: 67,
		},
		{
			startBeat: 11 / 16 * 1000 + 4000,
			note: 71,
		},
		{
			startBeat: 12 / 16 * 1000 + 4000,
			note: 72,
		},
		{
			startBeat: 13 / 16 * 1000 + 4000,
			note: 71,
		},
		{
			startBeat: 14 / 16 * 1000 + 4000,
			note: 67,
		},
		{
			startBeat: 15 / 16 * 1000 + 4000,
			note: 64,
		},

		{
			startBeat: 0 / 3 * 1000 + 6000,
			note: 71,
		},
		{
			startBeat: 0 / 3 * 1000 + 6000,
			note: 67,
		},
		{
			startBeat: 0 / 3 * 1000 + 6000,
			note: 64,
		},

		{
			startBeat: 1 / 3 * 1000 + 6000,
			note: 71,
		},
		{
			startBeat: 1 / 3 * 1000 + 6000,
			note: 67,
		},
		{
			startBeat: 1 / 3 * 1000 + 6000,
			note: 64,
		},

		{
			startBeat: 2 / 3 * 1000 + 6000,
			note: 71,
		},
		{
			startBeat: 2 / 3 * 1000 + 6000,
			note: 67,
		},
		{
			startBeat: 2 / 3 * 1000 + 6000,
			note: 64,
		},

		{
			startBeat: 0 / 3 * 1000 + 7000,
			note: 74,
		},
		{
			startBeat: 0 / 3 * 1000 + 7000,
			note: 70,
		},
		{
			startBeat: 0 / 3 * 1000 + 7000,
			note: 67,
		},
	]),
})

const shortLoopedMidiClip = makeMidiClip({
	length: 2 * 1000,
	loop: true,
	events: List([
		{
			startBeat: 0,
			note: 60,
		},
		{
			startBeat: 1 / 4 * 1000,
			note: 64,
		},
		{
			startBeat: 2 / 4 * 1000,
			note: 67,
		},
		{
			startBeat: 3 / 4 * 1000,
			note: 71,
		},
		{
			startBeat: 4 / 4 * 1000,
			note: 72,
		},
		{
			startBeat: 5 / 4 * 1000,
			note: 71,
		},
		{
			startBeat: 6 / 4 * 1000,
			note: 67,
		},
		{
			startBeat: 7 / 4 * 1000,
			note: 64,
		},
	]),
})

// const song = longDemoSong
const midiClip: MidiClip = shortLoopedMidiClip

const bpm = 60

let startTimeMs: number
let lastTimeMs: number

let stop = false
let started = false

/*
looping is hard
i would like a way to abstract away the fact that it loops from as much of this logic as possible
i got looping kind of working, but its not perfect and has edge cases that fail
the only thing that really needs to know about looping is the thing that reads the events, or provides the events
i wonder if i can make some kind of  stream that has events fed in from the original clip but with the times altered according to bpm and looping and stuff

midiClipStreamReader
- getNextEvent() => {startBeat: 1/4, note: 60}
- readBeats(0.5 beats) => {startBeat: 1/4, note: 60}
- getEventsInRange(start, end) => [{startTime: 1230.0, note: 60}, {startTime: 1231.5, note: 62}]
should the reader return events in the context of the midi clip or in the context of the song/app/scheduler?
what is needed to convert from clip context to global?
- current time
- bpm
- clip length?

clip
- length: 2
- events: [0.0, 0.25, 1.0, 1.5, 1.99]

g = global time
c = clip time
L - clip length

g    | c
0.00 | 0.00
0.25 | 0.25
1.00 | 1.00
1.50 | 1.50
1.99 | 1.99
2.00 | 0.00
2.25 | 0.25
3.00 | 1.00
3.99 | 1.99
4.00 | 0.00
5.00 | 1.00
6.00 | 0.00

c = f(g) = g % L

midiClipStreamReader needs to keep track of loop count

a system that use the midiClipStreamReader
scheduler

*/

const testClip = makeMidiClip({
	length: 2,
	loop: true,
	events: List([
		{startBeat: 0.0, note: 60},
		{startBeat: 0.25, note: 64},
		{startBeat: 1.0, note: 67},
		{startBeat: 1.5, note: 71},
		{startBeat: 1.99, note: 72},
		{startBeat: 2.0, note: 71},
	]),
})

function testGetNotes() {
	(
		[
			{start: 0.00, end: 0.00, expected: [{startBeat: 0.00, note: 60}]},
			{start: 0.25, end: 0.25, expected: [{startBeat: 0.25, note: 64}]},
			{start: 1.00, end: 1.00, expected: [{startBeat: 1.00, note: 67}]},
			{start: 2.00, end: 2.00, expected: [{startBeat: 0.00, note: 60}]},
			{start: 3.00, end: 3.00, expected: [{startBeat: 1.00, note: 67}]},
			{start: 3.99, end: 3.99, expected: [{startBeat: 1.99, note: 72}]},
			{start: 0.00, end: 0.01, expected: [{startBeat: 0.00, note: 72}]},
		] as Array<{start: number, end: number, expected: MidiEvent[]}>
	)
		.forEach(({start, end, expected}) => {
			const result = getNotes(start, end, testClip).toArray()

			// expect(result).to.deep.equal(expected)

			const fail = isEqual(result, expected) === false

			logger.log(
				`getNotes(${start.toFixed(2)}, ${end.toFixed(2)}, testClip): `
				+ JSON.stringify(getNotes(start, end, testClip).toArray())
				+ ' '
				+ (fail ? 'FAIL expected: ' + JSON.stringify(expected) : ''),
			)
		})
}

function getNotes(start: number, end: number, clip: MidiClip): MidiEvents {
	const bigStart = start * 1000
	const bigEnd = end * 1000
	const bigClipLength = clip.length * 1000
	const rangeLength = end - start

	if (rangeLength < 0) throw new Error('rangeLength < 0')
	if (clip.length <= 0) throw new Error('clip.length <= 0')
	// logger.log('start|end: ' + start + ' ' + end)

	if (rangeLength === 0) {
		const clipEventStart = bigStart % bigClipLength
		return clip.events.filter(x => {
			// logger.log(x.startBeat + ' ' + clipEventStart)
			return x.startBeat * 1000 === clipEventStart
		})
	} else if (rangeLength > 0) {
		return List()
	} else {
		throw createThisShouldntHappenError()
	}
}

function startMainLoop() {
	testGetNotes()

	return logger.warn('disabled')

	if (started) return
	started = true
	startTimeMs = performance.now()
	lastTimeMs = startTimeMs

	const startRangeBeat = currentBeat
	const endRangeBeat = currentBeat + lookAheadBeats + lookAheadRangeBeats

	logger.log(`START | currentBeat: ${currentBeat} | checking beats: ${startRangeBeat} <= beat < ${endRangeBeat} `)

	midiClip.events.forEach(({startBeat, note}, key) => {
		if (startBeat >= startRangeBeat && startBeat < endRangeBeat) {
			const delay = getDelayMs(startBeat, currentBeat, midiClip.length, bpm)
			logger.log(`  PLAY NOTE0 ${key}: `, {currentBeat, lastBeatChecked, note, delay, startBeat})
			playNote2(note, delay)
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

const createThisShouldntHappenError = () => new Error(`this shouldn't happen`)

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

			midiClip.events.forEach(({startBeat, note}, key) => {
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

			midiClip.events.forEach(({startBeat, note}, key) => {
				if (startRangeBeat1 <= startBeat && startBeat < endRangeBeat1) {
					const delay = getDelayMs(startBeat, currentBeat, midiClip.length, bpm)
					logger.log(`  PLAY NOTE2 ${key}: `, {currentBeat, lastBeatChecked, note, delay, startBeat})
					if (delay <= 0) throw new Error('delay <= 0')
					playNote2(note, delay)
				}
			})

			// TODO Deal with loop which is smaller than look ahead range

			midiClip.events.forEach(({startBeat, note}, key) => {
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

function playNote(note: IMidiNote, startDelayMs = 0) {
	if (startDelayMs <= 0) logger.warn('delay <= 0: ', startDelayMs)

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

function playNote2(note: IMidiNote, startDelayMs: number = 0) {
	if (startDelayMs <= 0) logger.warn('startDelayMs <= 0 | ', startDelayMs)
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
