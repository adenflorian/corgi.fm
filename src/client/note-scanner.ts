import {List, Set} from 'immutable'
import {ConnectionNodeType} from '../common/common-types'
import {logger} from '../common/logger'
import {ClientStore, IClientRoomState, ISequencerEvent, selectAllGridSequencers, selectGlobalClockState} from '../common/redux'
import {getInstruments} from './instrument-manager'
import {getNotes as getEvents, makeMidiClip, MidiClip, MidiClipEvents, Range} from './note-scheduler'
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
let _cursorSeconds = 0
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

function foo() {
	const roomState = _store.getState().room
	const {
		eventWindowSeconds, eventOffsetSeconds, isPlaying, bpm,
		maxReadAheadSeconds, maxReadWindowSeconds,
	} = selectGlobalClockState(roomState)

	if (isPlaying !== _isPlaying) {
		_isPlaying = isPlaying
		logger.log('[note-scanner] isPlaying: ', isPlaying)
		if (isPlaying) {
			startTimeInSeconds = _audioContext.currentTime
		}
	}

	if (isPlaying === false) return

	const currentSongTimeSeconds = _audioContext.currentTime - startTimeInSeconds

	// if playing
	// read from cursor to next cursor position
	// const cursorDestination = currentSongTime + eventOffsetSeconds + eventWindowSeconds
	_cursorSeconds = Math.max(_cursorSeconds, currentSongTimeSeconds)
	const cursorDestinationSeconds = currentSongTimeSeconds + maxReadAheadSeconds
	const secondsToRead = cursorDestinationSeconds - _cursorSeconds

	const readRangeSeconds = new Range(_cursorSeconds, secondsToRead)
	_cursorSeconds += secondsToRead

	logger.log('longDemoMidiClip: ', clip)
	logger.log('readRangeSeconds: ', readRangeSeconds)

	const eventsToSchedule = getEvents(clip, readRangeSeconds)
	logger.log('eventsToSchedule: ', eventsToSchedule)

	const instruments = getInstruments()

	let flag = false

	// distance from currentSongTime to where the cursor just started reading events from
	const offset = _cursorSeconds - currentSongTimeSeconds

	instruments[ConnectionNodeType.basicSynthesizer].forEach((x, _) => {
		// temp: so that only the first synth is used
		if (flag) return

		flag = true

		const synth = x as BasicSynthesizer

		eventsToSchedule.forEach(event => {
			synth.scheduleNote(event.note, offset + event.startTime)
			logger.log('scheduleNote')
		})
	})

	// const secondsSinceAppStart = msSinceAppStart / 1000

	// const clips = getEventsFromState(roomState)

	// schedule/play notes
	// need access to instruments from instrument-manager
	// const instruments = getInstruments()

	// console.log(clips)

	// clips.forEach(clip => {
	// 	const notes = getNotes(clip, new Range(secondsSinceAppStart, 0.1))
	// 	console.log('notes: ', notes)

	// 	notes.forEach(note => {
	// 		// play on connected instruments
	// 		let flag = false
	// 		instruments[ConnectionNodeType.basicSynthesizer].forEach((x, _) => {
	// 			if (flag) {
	// 				return
	// 			} else {
	// 				flag = true
	// 			}
	// 			console.log('AAAAAAAA')

	// 			const synth = x as BasicSynthesizer

	// 			synth.setMidiNotes(Set([note.note]))
	// 		})
	// 	})
	// })
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
