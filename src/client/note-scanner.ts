import {List} from 'immutable'
import {ConnectionNodeType} from '../common/common-types'
import {logger} from '../common/logger'
import {
	ClientStore, IClientRoomState, ISequencerEvent,
	selectAllGridSequencers, selectGlobalClockState,
} from '../common/redux'
import {postalClipB} from './clips';
import {getInstruments} from './instrument-manager'
import {getEvents, makeMidiClip, MidiClip, MidiClipEvents, Range} from './note-scheduler'
import {BasicSynthesizer} from './WebAudio/BasicSynthesizer'

let _store: ClientStore
let _audioContext: AudioContext

export function startNoteScanner(store: ClientStore, audioContext: AudioContext) {
	logger.log('startNoteScanner')
	_store = store
	_audioContext = audioContext
	requestAnimationFrame(mainLoop)
}

let _isPlaying = false
let _cursorBeats = 0
let stop = false
let startTimeInSeconds = 0

if (module.hot) {
	module.hot.dispose(() => {
		stop = true
	})
}

function mainLoop(msSinceAppStart: number) {
	// logger.log('im a loop: ', msSinceAppStart)
	if (stop === true) return

	foo()

	requestAnimationFrame(mainLoop)
}

const postalClipA = makeMidiClip({
	length: 200,
	loop: true,
	events: List([
		{
			startBeat: 261,
			note: 56,
		},
		{
			startBeat: 261,
			note: 41,
		},
		{
			startBeat: 17029,
			note: 60,
		},
		{
			startBeat: 17029,
			note: 46,
		},
		{
			startBeat: 17125,
			note: 61,
		},
		{
			startBeat: 17221,
			note: 60,
		},
		{
			startBeat: 17317,
			note: 46,
		},
		{
			startBeat: 17413,
			note: 55,
		},
		{
			startBeat: 17413,
			note: 40,
		},
		{
			startBeat: 17605,
			note: 55,
		},
		{
			startBeat: 17605,
			note: 40,
		},
		{
			startBeat: 34565,
			note: 65,
		},
		{
			startBeat: 34565,
			note: 41,
		},
		{
			startBeat: 34661,
			note: 48,
		},
		{
			startBeat: 34757,
			note: 53,
		},
		{
			startBeat: 34853,
			note: 46,
		},
		{
			startBeat: 34949,
			note: 58,
		},
		{
			startBeat: 34949,
			note: 48,
		},
		{
			startBeat: 35141,
			note: 58,
		},
		{
			startBeat: 35141,
			note: 48,
		},
		{
			startBeat: 52005,
			note: 53,
		},
		{
			startBeat: 52053,
			note: 56,
		},
		{
			startBeat: 52101,
			note: 63,
		},
		{
			startBeat: 52101,
			note: 49,
		},
		{
			startBeat: 68677,
			note: 61,
		},
		{
			startBeat: 85253,
			note: 60,
		},
		{
			startBeat: 85253,
			note: 48,
		},
		{
			startBeat: 85349,
			note: 61,
		},
		{
			startBeat: 85445,
			note: 60,
		},
		{
			startBeat: 85541,
			note: 48,
		},
		{
			startBeat: 85637,
			note: 56,
		},
		{
			startBeat: 85637,
			note: 41,
		},
		{
			startBeat: 85829,
			note: 56,
		},
		{
			startBeat: 85829,
			note: 41,
		},
		{
			startBeat: 102597,
			note: 60,
		},
		{
			startBeat: 102597,
			note: 46,
		},
		{
			startBeat: 102693,
			note: 61,
		},
		{
			startBeat: 102789,
			note: 60,
		},
		{
			startBeat: 102885,
			note: 46,
		},
		{
			startBeat: 102981,
			note: 55,
		},
		{
			startBeat: 102981,
			note: 40,
		},
		{
			startBeat: 103173,
			note: 55,
		},
		{
			startBeat: 103173,
			note: 40,
		},
	])
		.map(x => ({...x, startBeat: x.startBeat / 261})),
})

// console.log('postalClipA: ', postalClipA.toJS())

const shortDemoMidiClip = makeMidiClip({
	length: 2,
	loop: true,
	events: List([
		{
			startBeat: 0,
			note: 60,
		},
		{
			startBeat: 0,
			note: 48,
		},
		{
			startBeat: 1 / 4,
			note: 64,
		},
		{
			startBeat: 2 / 4,
			note: 67,
		},
		{
			startBeat: 3 / 4,
			note: 71,
		},
		{
			startBeat: 4 / 4,
			note: 72,
		},
		{
			startBeat: 5 / 4,
			note: 71,
		},
		{
			startBeat: 6 / 4,
			note: 67,
		},
		{
			startBeat: 7 / 4,
			note: 64,
		},
	]),
})

const longDemoMidiClip = makeMidiClip({
	length: 8,
	loop: true,
	events: List([
		{
			startBeat: 0,
			note: 60,
		},
		{
			startBeat: 1 / 4,
			note: 64,
		},
		{
			startBeat: 2 / 4,
			note: 67,
		},
		{
			startBeat: 3 / 4,
			note: 71,
		},
		{
			startBeat: 4 / 4,
			note: 72,
		},
		{
			startBeat: 5 / 4,
			note: 71,
		},
		{
			startBeat: 6 / 4,
			note: 67,
		},
		{
			startBeat: 7 / 4,
			note: 64,
		},
		{
			startBeat: 0 + 2,
			note: 60,
		},
		{
			startBeat: 1 / 8 + 2,
			note: 64,
		},
		{
			startBeat: 2 / 8 + 2,
			note: 67,
		},
		{
			startBeat: 3 / 8 + 2,
			note: 71,
		},
		{
			startBeat: 4 / 8 + 2,
			note: 72,
		},
		{
			startBeat: 5 / 8 + 2,
			note: 71,
		},
		{
			startBeat: 6 / 8 + 2,
			note: 67,
		},
		{
			startBeat: 7 / 8 + 2,
			note: 64,
		},
		{
			startBeat: 0 + 3,
			note: 60,
		},
		{
			startBeat: 1 / 8 + 3,
			note: 64,
		},
		{
			startBeat: 2 / 8 + 3,
			note: 67,
		},
		{
			startBeat: 3 / 8 + 3,
			note: 71,
		},
		{
			startBeat: 4 / 8 + 3,
			note: 72,
		},
		{
			startBeat: 5 / 8 + 3,
			note: 71,
		},
		{
			startBeat: 6 / 8 + 3,
			note: 67,
		},
		{
			startBeat: 7 / 8 + 3,
			note: 64,
		},
		{
			startBeat: 0 / 16 + 4,
			note: 60,
		},
		{
			startBeat: 1 / 16 + 4,
			note: 64,
		},
		{
			startBeat: 2 / 16 + 4,
			note: 67,
		},
		{
			startBeat: 3 / 16 + 4,
			note: 71,
		},
		{
			startBeat: 4 / 16 + 4,
			note: 72,
		},
		{
			startBeat: 5 / 16 + 4,
			note: 71,
		},
		{
			startBeat: 6 / 16 + 4,
			note: 67,
		},
		{
			startBeat: 7 / 16 + 4,
			note: 64,
		},
		{
			startBeat: 8 / 16 + 4,
			note: 60,
		},
		{
			startBeat: 9 / 16 + 4,
			note: 64,
		},
		{
			startBeat: 10 / 16 + 4,
			note: 67,
		},
		{
			startBeat: 11 / 16 + 4,
			note: 71,
		},
		{
			startBeat: 12 / 16 + 4,
			note: 72,
		},
		{
			startBeat: 13 / 16 + 4,
			note: 71,
		},
		{
			startBeat: 14 / 16 + 4,
			note: 67,
		},
		{
			startBeat: 15 / 16 + 4,
			note: 64,
		},

		{
			startBeat: 0 / 3 + 6,
			note: 71,
		},
		{
			startBeat: 0 / 3 + 6,
			note: 67,
		},
		{
			startBeat: 0 / 3 + 6,
			note: 64,
		},

		{
			startBeat: 1 / 3 + 6,
			note: 71,
		},
		{
			startBeat: 1 / 3 + 6,
			note: 67,
		},
		{
			startBeat: 1 / 3 + 6,
			note: 64,
		},

		{
			startBeat: 2 / 3 + 6,
			note: 71,
		},
		{
			startBeat: 2 / 3 + 6,
			note: 67,
		},
		{
			startBeat: 2 / 3 + 6,
			note: 64,
		},

		{
			startBeat: 0 / 3 + 7,
			note: 74,
		},
		{
			startBeat: 0 / 3 + 7,
			note: 70,
		},
		{
			startBeat: 0 / 3 + 7,
			note: 67,
		},
	]),
})

const clip = postalClipB

// TODO Where to apply actualBPM

function foo() {
	const roomState = _store.getState().room
	const {
		eventWindowSeconds, eventOffsetSeconds, isPlaying, bpm,
		maxReadAheadSeconds, maxReadWindowSeconds,
	} = selectGlobalClockState(roomState)

	const actualBPM = Math.max(0.000001, bpm)

	if (isPlaying !== _isPlaying) {
		_isPlaying = isPlaying
		logger.log('[note-scanner] isPlaying: ', isPlaying)
		if (isPlaying) {
			startTimeInSeconds = _audioContext.currentTime
			_cursorBeats = 0
			logger.log('[note-scanner] startTimeInSeconds: ', startTimeInSeconds)
		}
	}

	if (isPlaying === false) return

	const currentSongTimeBeats = (_audioContext.currentTime - startTimeInSeconds) * (actualBPM / 60)

	const maxReadAheadBeats = maxReadAheadSeconds * (actualBPM / 60)

	// if playing
	// read from cursor to next cursor position
	_cursorBeats = Math.max(_cursorBeats, currentSongTimeBeats)
	const cursorDestinationBeats = currentSongTimeBeats + maxReadAheadBeats
	const beatsToRead = Math.max(0, (cursorDestinationBeats - _cursorBeats) * (1))

	// distance from currentSongTime to where the cursor just started reading events from
	const offset = _cursorBeats - currentSongTimeBeats

	const readRangeBeats = new Range(_cursorBeats, beatsToRead)

	const eventsToSchedule = getEvents(clip, readRangeBeats)

	// logger.log('actualBPM: ', actualBPM)
	// logger.log('maxReadAheadBeats: ', maxReadAheadBeats)
	// logger.log('currentSongTimeSeconds: ', currentSongTimeBeats)
	// logger.log('_cursorSeconds: ', _cursorBeats)
	// logger.log('cursorDestinationSeconds: ', cursorDestinationBeats)
	// logger.log('secondsToRead: ', beatsToRead)
	// logger.log('offset: ', offset)
	// logger.log('_cursorSeconds - currentSongTimeSeconds: ', _cursorBeats - currentSongTimeBeats)
	// logger.log('clip: ', clip)
	// logger.log('readRangeBeats: ', readRangeBeats)
	// logger.log('eventsToSchedule: ', eventsToSchedule)

	const instruments = getInstruments()

	let flag = false

	instruments[ConnectionNodeType.basicSynthesizer].forEach((x, _) => {
		// temp: so that only the first synth is used
		if (flag) return

		flag = true

		const synth = x as BasicSynthesizer

		eventsToSchedule.forEach(event => {
			// logger.log('scheduleNote currentSongTimeBeats: ', currentSongTimeBeats)
			// logger.log('offset: ', offset)
			// logger.log('event.startTime: ', event.startTime)
			synth.scheduleNote(event.note, ((offset + event.startTime) * (60 / actualBPM)))
		})
	})

	_cursorBeats += beatsToRead
}
