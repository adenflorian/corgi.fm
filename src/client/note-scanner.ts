import {Map} from 'immutable'
import {MidiRange, makeMidiClip} from '../common/common-types'
import {logger} from '../common/logger'
import {
	ClientStore, selectGlobalClockState, selectAllSequencers,
	selectConnectionSourceIdsByTarget,
} from '../common/redux'
import {shortDemoMidiClip} from './clips'
import {getAllInstruments} from './instrument-manager'
import {getEvents} from './note-scheduler'
import {IMidiNotes} from '../common/MidiNote'

let _store: ClientStore
let _audioContext: AudioContext

export function startNoteScanner(store: ClientStore, audioContext: AudioContext) {
	logger.log('startNoteScanner')
	_store = store
	_audioContext = audioContext
	requestAnimationFrame(mainLoop)
}

let stop = false

function mainLoop() {
	if (stop === true) return

	scheduleNotes()

	requestAnimationFrame(mainLoop)
}

if (module.hot) {
	module.hot.dispose(() => {
		stop = true
	})
}

let clip = shortDemoMidiClip

// not sure if needed?
// causes problems with range 0 and repeating notes on start
const _jumpStartSeconds = 0.0

let _isPlaying = false
let _cursorBeats = 0
let currentSongTimeBeats = 0
let lastAudioContextTime = 0
let _justStarted = false

const emptyMidiClip = makeMidiClip()

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
	const offset = _cursorBeats - currentSongTimeBeats

	const readRangeBeats = new MidiRange(_cursorBeats, beatsToRead)

	// run all sequencers events thru scheduler

	const sequencersEvents = Map(selectAllSequencers(roomState))
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

	console.log('instruments: ', instruments)

	let flag = false

	// then for each instrument
	// union events from the input sequencers and schedule them
	instruments.forEach(instrument => {
		// how to get input events
		// how to know which ones to get
		// make a selector to get array of source IDs?
		const sourceIds = selectConnectionSourceIdsByTarget(roomState, instrument.id)

		console.log('sourceIds: ', sourceIds)

		const eventsToSchedule = Map<number, IMidiNotes>().withMutations(mutable => {
			sequencersEvents.filter((_, id) => sourceIds.includes(id))
				.toList()
				.flatMap(x => x).forEach(event => {
					if (mutable.has(event.startTime)) {
						mutable.update(event.startTime, x => x.union(event.notes))
					} else {
						mutable.set(event.startTime, event.notes)
					}
				})
		})

		console.log('eventsToSchedule: ', eventsToSchedule)
		// union events
		// how?
		// off of what field?
		// startBeat
		// make a map where key is startBeat and val is notes
		// union the notes together



		eventsToSchedule.forEach((notes, startTime) => {
			// logger.log('scheduleNote currentSongTimeBeats: ', currentSongTimeBeats)
			// logger.log('offset: ', offset)
			// logger.log('event.startTime: ', event.startTime)
			const delaySeconds = ((offset + startTime) * (60 / actualBPM))

			const noteLength = 0.1

			notes.forEach(note => {
				console.log('actualNote: ' + note + ' | delaySeconds: ' + delaySeconds)
				// console.log('gridSeq: ', gridSeq)
				instrument.scheduleNote(note, delaySeconds)
				instrument.scheduleRelease(note, delaySeconds + noteLength)
			})
		})

	})

	_cursorBeats += beatsToRead
	_justStarted = false
}
