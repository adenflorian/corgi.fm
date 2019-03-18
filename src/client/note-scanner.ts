import {Map, Set} from 'immutable'
import {logger} from '../common/logger'
import {MidiGlobalClipEvent, MidiRange} from '../common/midi-types'
import {
	ClientStore, selectAllSequencers, selectConnectionSourceIdsByTarget,
	selectGlobalClockState,
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

export function getCurrentSongTime() {
	return _audioContext.currentTime - songStartTimeSeconds
}

export function getCurrentSongIsPlaying() {
	return _isPlaying
}

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
		.filter(seq => seq.isPlaying)
		.map(seq => ({
			seq,
			events: getEvents(seq.midiClip, readRangeBeats)
				.map(event => applyGateToEvent(seq.gate, event))
				.map(event => ({
					...event,
					notes: event.notes.map(note => note + Math.round(seq.pitch)),
				})),
		}))

	const instruments = getAllInstruments()

	// then for each instrument
	// union events from the input sequencers and schedule them
	instruments.forEach(instrument => {
		const sourceIds = selectConnectionSourceIdsByTarget(roomState, instrument.id)

		const eventsToSchedule = Map<number, MidiGlobalClipEvent & {sourceIds: Set<string>}>().withMutations(mutableEvents => {
			sequencersEvents.filter((_, id) => sourceIds.includes(id))
				.forEach(({seq, events}, sourceId) => {
					events.forEach(event => {
						// TODO Need to check end time as well I think
						if (mutableEvents.has(event.startTime)) {
							mutableEvents.update(event.startTime, x => ({
								...x,
								notes: x.notes.union(event.notes),
								sourceIds: x.sourceIds.add(sourceId),
							}))
						} else {
							mutableEvents.set(event.startTime, {
								...event,
								sourceIds: Set([sourceId]),
							})
						}
					})
				})

		})

		eventsToSchedule.forEach(event => {
			const delaySecondsUntilStart = ((offsetBeats + event.startTime) * (60 / actualBPM))

			const delaySecondsUntilRelease = ((offsetBeats + event.endTime) * (60 / actualBPM))

			event.notes.forEach(note => {
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

function releaseAllNotesOnAllInstruments() {
	getAllInstruments().forEach(x => x.releaseAllScheduled())
}
