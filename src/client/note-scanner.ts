import {List} from 'immutable'
import {ConnectionNodeType} from '../common/common-types'
import {logger} from '../common/logger'
import {
	ClientStore, IClientRoomState, ISequencerEvent,
	selectAllGridSequencers, selectGlobalClockState,
} from '../common/redux'
import {longDemoMidiClip, postalClipB, shortDemoMidiClip} from './clips'
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

let stop = false

function mainLoop(msSinceAppStart: number) {
	// logger.log('im a loop: ', msSinceAppStart)
	if (stop === true) return

	foo()

	requestAnimationFrame(mainLoop)
}

if (module.hot) {
	module.hot.dispose(() => {
		stop = true
	})
}

const clip = shortDemoMidiClip

let _isPlaying = false
let _cursorBeats = 0
let startTimeInSeconds = 0
let currentSongTimeBeats = 0
let lastAudioContextTime = 0

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
			currentSongTimeBeats = 0
			_cursorBeats = 0
			lastAudioContextTime = 0
			logger.log('[note-scanner] startTimeInSeconds: ', startTimeInSeconds)
		}
	}

	if (isPlaying === false) return

	const deltaTimeSeconds = _audioContext.currentTime - lastAudioContextTime

	lastAudioContextTime = _audioContext.currentTime

	const deltaBeats = deltaTimeSeconds * (actualBPM / 60)

	currentSongTimeBeats += deltaBeats

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
			const delaySeconds = ((offset + event.startTime) * (60 / actualBPM))
			synth.scheduleNote(event.note, delaySeconds)
			synth.scheduleRelease(event.note, delaySeconds, delaySeconds + 0.1)
		})
	})

	_cursorBeats += beatsToRead
}
