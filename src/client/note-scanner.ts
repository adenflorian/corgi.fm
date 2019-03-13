import {Map} from 'immutable'
import {logger} from '../common/logger'
import {MidiClip, MidiGlobalClipEvent, MidiRange} from '../common/midi-types'
import {IMidiNotes} from '../common/MidiNote'
import {
	ClientStore, selectAllSequencers, selectConnectionSourceIdsByTarget,
	selectGlobalClockState,
} from '../common/redux'
import {shortDemoMidiClip} from './clips'
import {getAllInstruments} from './instrument-manager'
import {getEvents} from './note-scheduler'

let _store: ClientStore
let _audioContext: AudioContext

export function startNoteScanner(store: ClientStore, audioContext: AudioContext) {
	logger.log('startNoteScanner')
	_store = store
	_audioContext = audioContext
	stop = false
	requestAnimationFrame(() => mainLoop(currentLoopId))
}

let stop = true

let isActiveTab = true

window.addEventListener('blur', () => {
	isActiveTab = false
	// Make sure this doesn't cause multiple loops
	currentLoopId++
	mainLoop(currentLoopId)
}, false)

window.addEventListener('focus', () => {
	isActiveTab = true
}, false)

let currentLoopId = 0

function mainLoop(loopId: number) {
	if (stop === true) return
	if (loopId < currentLoopId) return

	scheduleNotes()

	if (isActiveTab) {
		requestAnimationFrame(() => mainLoop(loopId))
	} else {
		setTimeout(() => mainLoop(loopId), 16)
	}
}

if (module.hot) {
	module.hot.dispose(() => {
		stop = true
	})
}

const clip = shortDemoMidiClip

// not sure if needed?
// causes problems with range 0 and repeating notes on start
const _jumpStartSeconds = 0.0

let _isPlaying = false
let _cursorBeats = 0
let currentSongTimeBeats = 0
let lastAudioContextTime = 0
let _justStarted = false
let songStartTimeSeconds = 0

export function getCurrentSongTime() {
	return _audioContext.currentTime - songStartTimeSeconds
}

export function getCurrentSongIsPlaying() {
	return _isPlaying
}

const emptyMidiClip = new MidiClip()

function scheduleNotes() {
	const roomState = _store.getState().room

	const {
		isPlaying, bpm, maxReadAheadSeconds,
	} = selectGlobalClockState(roomState)

	const actualBPM = Math.max(0.000001, bpm)

	if (isPlaying !== _isPlaying) {
		_isPlaying = isPlaying
		logger.log('[note-scanner] isPlaying: ', isPlaying)
		if (isPlaying) {
			_justStarted = true
			songStartTimeSeconds = _audioContext.currentTime
		} else {
			// song stopped
			// release all notes on all instruments
			releaseAllNotesOnAllInstruments()
		}
	}

	if (isPlaying === false) return

	const deltaTimeSeconds = _audioContext.currentTime - lastAudioContextTime
	lastAudioContextTime = _audioContext.currentTime

	const deltaBeats = deltaTimeSeconds * (actualBPM / 60)

	currentSongTimeBeats += deltaBeats

	if (_justStarted) {
		currentSongTimeBeats = 0
		_cursorBeats = 0
	}

	const maxReadAheadBeats = maxReadAheadSeconds * (actualBPM / 60)

	// if playing
	// read from cursor to next cursor position
	_cursorBeats = Math.max(_cursorBeats, currentSongTimeBeats)
	const cursorDestinationBeats = currentSongTimeBeats + maxReadAheadBeats
	const minBeatsToRead = _justStarted
		? (_jumpStartSeconds * (actualBPM / 60))
		: 0
	const beatsToRead = Math.max(minBeatsToRead, cursorDestinationBeats - _cursorBeats)

	// distance from currentSongTime to where the cursor just started reading events from
	const offsetBeats = _cursorBeats - currentSongTimeBeats

	const readRangeBeats = new MidiRange(_cursorBeats, beatsToRead)

	// run all sequencers events thru scheduler
	const sequencersEvents = Map(selectAllSequencers(roomState))
		.filter(x => x.isPlaying)
		.map(x => getEvents(x.midiClip, readRangeBeats))

	// clip = gridSeq ? gridSeq.midiClip : emptyMidiClip
	// clip = shortDemoMidiClip

	// const eventsToSchedule = getEvents(clip, readRangeBeats)

	// logger.log('actualBPM: ', actualBPM)
	// logger.log('maxReadAheadBeats: ', maxReadAheadBeats)
	// logger.log('currentSongTimeBeats: ', currentSongTimeBeats)
	// logger.log('_cursorBeats: ', _cursorBeats)
	// logger.log('cursorDestinationSeconds: ', cursorDestinationBeats)
	// logger.log('beatsToRead: ', beatsToRead)
	// logger.log('offset: ', offset)
	// logger.log('_cursorBeats - currentSongTimeSeconds: ', _cursorBeats - currentSongTimeBeats)
	// logger.log('clip: ', clip)
	// logger.log('readRangeBeats: ', readRangeBeats)
	// logger.log('eventsToSchedule: ', eventsToSchedule)

	const instruments = getAllInstruments()

	// console.log('instruments: ', instruments)

	// then for each instrument
	// union events from the input sequencers and schedule them
	instruments.forEach(instrument => {
		const sourceIds = selectConnectionSourceIdsByTarget(roomState, instrument.id)

		// console.log('sourceIds: ', sourceIds)

		const eventsToSchedule = Map<number, MidiGlobalClipEvent>().withMutations(mutableEvents => {
			sequencersEvents.filter((_, id) => sourceIds.includes(id))
				.toList()
				.flatMap(x => x).forEach(event => {
					if (mutableEvents.has(event.startTime)) {
						mutableEvents.update(event.startTime, x => ({...x, notes: x.notes.union(event.notes)}))
					} else {
						mutableEvents.set(event.startTime, event)
					}
				})
		})

		eventsToSchedule.forEach(event => {
			// logger.log('scheduleNote currentSongTimeBeats: ', currentSongTimeBeats)
			// logger.log('offset: ', offset)
			// logger.log('event.startTime: ', event.startTime)
			const delaySecondsUntilStart = ((offsetBeats + event.startTime) * (60 / actualBPM))

			const delaySecondsUntilRelease = ((offsetBeats + event.endTime) * (60 / actualBPM))

			event.notes.forEach(note => {
				// console.log('actualNote: ' + note + ' | delaySeconds: ' + delaySeconds)
				// console.log('gridSeq: ', gridSeq)
				instrument.scheduleNote(note, delaySecondsUntilStart, false)
				instrument.scheduleRelease(note, delaySecondsUntilRelease)
			})
		})

	})

	_cursorBeats += beatsToRead
	_justStarted = false
}

function releaseAllNotesOnAllInstruments() {
	getAllInstruments().forEach(x => x.releaseAllScheduled())
}
