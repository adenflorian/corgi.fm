import {List, Map, Set} from 'immutable'
import {logger} from '../common/logger'
import {MidiGlobalClipEvent, MidiRange} from '../common/midi-types'
import {
	ClientStore, selectAllSequencers, selectConnectionSourceIdsByTarget,
	selectGlobalClockState,
	selectSequencerIsPlaying,
} from '../common/redux'
import {getAllInstruments} from './instrument-manager'
import {getEvents} from './note-scheduler'

let _store: ClientStore
let _audioContext: AudioContext

export function startNoteScanner(store: ClientStore, audioContext: AudioContext) {
	logger.log('startNoteScanner')
	_store = store
	_audioContext = audioContext
	stop = false
	return mainLoop
}

let stop = true

function mainLoop() {
	if (stop === true) return

	scheduleNotes()
}

// not sure if needed?
// causes problems with range 0 and repeating notes on start
const _jumpStartSeconds = 0.0

let _isPlaying = false
let _cursorBeats = 0
let currentSongTimeBeats = 0
let lastAudioContextTime = 0
let _justStarted = false
let songStartTimeSeconds = 0
/** Used for knowing when to restart */
let _playCount = 0

let _sequencersInfo = Map<string, {loopRatio: number}>()

export function getSequencersSchedulerInfo() {
	return _sequencersInfo
}

export function getCurrentSongTime() {
	return _audioContext.currentTime - songStartTimeSeconds
}

export function getCurrentSongIsPlaying() {
	return _isPlaying
}

function scheduleNotes() {
	const roomState = _store.getState().room

	const {
		isPlaying, bpm, maxReadAheadSeconds, playCount,
	} = selectGlobalClockState(roomState)

	const actualBPM = Math.max(0.000001, bpm)
	const toBeats = (x: number) => x * (actualBPM / 60)
	const fromBeats = (x: number) => x * (60 / actualBPM)

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

	const deltaBeats = toBeats(deltaTimeSeconds)

	currentSongTimeBeats += deltaBeats

	if (_justStarted || _playCount !== playCount) {
		currentSongTimeBeats = 0
		_cursorBeats = 0
		_playCount = playCount
	}

	const maxReadAheadBeats = toBeats(maxReadAheadSeconds)

	// if playing
	// read from cursor to next cursor position
	_cursorBeats = Math.max(_cursorBeats, currentSongTimeBeats)
	const cursorDestinationBeats = currentSongTimeBeats + maxReadAheadBeats
	const minBeatsToRead = _justStarted
		? (toBeats(_jumpStartSeconds))
		: 0
	const beatsToRead = Math.max(minBeatsToRead, cursorDestinationBeats - _cursorBeats)

	// distance from currentSongTime to where the cursor just started reading events from
	const offsetBeats = _cursorBeats - currentSongTimeBeats

	const readRangeBeats = new MidiRange(_cursorBeats, beatsToRead)

	// run all sequencers events thru scheduler
	const sequencersEvents = Map(selectAllSequencers(roomState))
		.filter(seq => selectSequencerIsPlaying(roomState, seq.id))
		.map(seq => ({
			seq,
			events: getEvents(seq.midiClip, readRangeBeats)
				.map(event => applyGateToEvent(seq.gate, event))
				.map(event => ({
					...event,
					notes: event.notes.map(note => note + Math.round(seq.pitch)),
				}) as MidiGlobalClipEvent)
				.map(flattenEventNotes)
				.flatten() as List<MidiGlobalClipEvent>,
		}))

	_sequencersInfo = sequencersEvents.map(x => ({
		loopRatio: (currentSongTimeBeats % x.seq.midiClip.length) / x.seq.midiClip.length,
	}))

	const instruments = getAllInstruments()

	// then for each instrument
	// union events from the input sequencers and schedule them
	instruments.forEach(instrument => {
		const sourceIds = selectConnectionSourceIdsByTarget(roomState, instrument.id)

		const eventsToSchedule = List<MidiGlobalClipEvent & {sourceIds: Set<string>}>()
			.withMutations(mutableEvents => {
				sequencersEvents
					.filter((_, id) => sourceIds.includes(id))
					.forEach(({seq, events}, sourceId) => {
						events.forEach(event => {
							// Each event at this point has a single note
							if (event.notes.count() !== 1) logger.error('event.notes.count() !== 1')

							mutableEvents.push({
								...event,
								sourceIds: Set([sourceId]),
							})
						})
					})
			})

		let scheduledNotesWithTimes = List<string>()

		eventsToSchedule.forEach(event => {
			const delaySecondsUntilStart = (fromBeats(offsetBeats + event.startTime))

			const delaySecondsUntilRelease = (fromBeats(offsetBeats + event.endTime))

			event.notes.forEach(note => {
				const slug = event.startTime.toString() + '-' + note.toString()

				if (scheduledNotesWithTimes.includes(slug)) return

				scheduledNotesWithTimes = scheduledNotesWithTimes.push(slug)

				instrument.scheduleNote(note, delaySecondsUntilStart, false, event.sourceIds)
				instrument.scheduleRelease(note, delaySecondsUntilRelease)
			})
		})

	})

	_cursorBeats += beatsToRead
	_justStarted = false
}

function applyGateToEvent(gate: number, event: MidiGlobalClipEvent): MidiGlobalClipEvent {
	if (gate === 1) return event

	const length = event.endTime - event.startTime
	const newLength = length * gate
	const newEndTime = event.startTime + newLength

	return {
		...event,
		endTime: newEndTime,
	}
}

/** Put each note in it's own event */
function flattenEventNotes(event: MidiGlobalClipEvent): List<MidiGlobalClipEvent> {
	return event.notes.toList()
		.map(note => ({
			...event,
			notes: Set([note]),
		}))
}

function releaseAllNotesOnAllInstruments() {
	getAllInstruments().forEach(x => x.releaseAllScheduled())
}
