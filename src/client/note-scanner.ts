import {List} from 'immutable'
import {ConnectionNodeType} from '../common/common-types'
import {logger} from '../common/logger'
import {
	ClientStore, IClientRoomState, ISequencerEvent,
	selectAllGridSequencers, selectGlobalClockState,
} from '../common/redux'
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

const clip = makeMidiClip({
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

// TODO Where to apply actualBPM

function foo() {
	const roomState = _store.getState().room
	const {
		eventWindowSeconds, eventOffsetSeconds, isPlaying, bpm,
		maxReadAheadSeconds, maxReadWindowSeconds,
	} = selectGlobalClockState(roomState)

	const actualBPM = Math.max(0.000001, 240)

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

function getEventsFromState(roomState: IClientRoomState) {
	const sequencers = selectAllGridSequencers(roomState)

	const clips = Object.keys(sequencers)
		.map(x => sequencers[x])
		.filter(x => x.isPlaying)
		.map(x => x.events)
		.map(makeMidiClipFromGridSeqEvents)

	return clips
}

function makeMidiClipFromGridSeqEvents(events: List<ISequencerEvent>): MidiClip {
	return makeMidiClip({
		length: events.count(),
		loop: true,
		events: convertGridSeqEvents(events),
	})
}

function convertGridSeqEvents(events: List<ISequencerEvent>): MidiClipEvents {
	return events.map(convertGridSeqEvent).reduce((x, y) => x.concat(y))
}

function convertGridSeqEvent(event: ISequencerEvent): MidiClipEvents {
	return event.notes.map((x, i) => ({
		note: x,
		startBeat: i,
	})).toList()
}
