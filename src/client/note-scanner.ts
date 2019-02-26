import {ConnectionNodeType, MidiRange, makeMidiClip} from '../common/common-types'
import {logger} from '../common/logger'
import {
	ClientStore, selectGlobalClockState, selectAllGridSequencers, selectAllSequencers,
} from '../common/redux'
import {shortDemoMidiClip} from './clips'
import {getEvents} from './note-scheduler'
import {BasicSynthesizer} from './WebAudio/BasicSynthesizer'

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

	const allSequencers = selectAllSequencers(roomState)

	const allSequencersArray = Object.freeze(
		Object.keys(allSequencers)
			.map(x => allSequencers[x])
	)



	// clip = gridSeq ? gridSeq.midiClip : emptyMidiClip

	const eventsToSchedule = getEvents(clip, readRangeBeats)

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

	// const instruments = getInstruments()

	let flag = false

	// then for each instrument
	// union events from the input sequencers and schedule them

	// instruments[ConnectionNodeType.basicSynthesizer].forEach((x, _) => {
	// 	// temp: so that only the first synth is used
	// 	if (flag) return

	// 	flag = true

	// 	const synth = x as BasicSynthesizer


	// 	eventsToSchedule.forEach(event => {
	// 		// logger.log('scheduleNote currentSongTimeBeats: ', currentSongTimeBeats)
	// 		// logger.log('offset: ', offset)
	// 		// logger.log('event.startTime: ', event.startTime)
	// 		const delaySeconds = ((offset + event.startTime) * (60 / actualBPM))

	// 		const noteLength = 0.1

	// 		event.notes.forEach(note => {
	// 			console.log('actualNote: ' + note + ' | delaySeconds: ' + delaySeconds)
	// 			// console.log('gridSeq: ', gridSeq)
	// 			synth.scheduleNote(note, delaySeconds)
	// 			synth.scheduleRelease(note, delaySeconds + noteLength)
	// 		})
	// 	})
	// })

	_cursorBeats += beatsToRead
	_justStarted = false
}
