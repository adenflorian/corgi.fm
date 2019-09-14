import {List, Map, Set} from 'immutable'
import {MidiGlobalClipEvent, midiPrecision, MidiRange} from '@corgifm/common/midi-types'
import {
	ClientStore, GroupSequencers,
	IClientRoomState,
	MASTER_CLOCK_SOURCE_ID,
	selectAllGroupSequencers,
	selectAllSequencers,
	selectConnectionSourceIdsByTarget,
	selectConnectionsWithTargetIds,
	selectGlobalClockState,
	selectPosition,
	selectSequencerIsPlaying,
} from '@corgifm/common/redux'
import {GetAllAudioNodes, GetAllInstruments} from './instrument-manager'
import {getEvents} from './note-scheduler'
import {logger} from './client-logger'

let _store: ClientStore
let _audioContext: AudioContext

export function startNoteScanner(
	store: ClientStore,
	audioContext: AudioContext,
	getAllInstruments: GetAllInstruments,
	getAllAudioNodes: GetAllAudioNodes,
) {
	logger.log('startNoteScanner')
	_store = store
	_audioContext = audioContext
	return () => scheduleNotes(getAllInstruments, getAllAudioNodes)
}

// not sure if needed?
// causes problems with range 0 and repeating notes on start
const _jumpStartSeconds = 0.0

let _isPlaying = false
let _isMasterClockEnabled = true
let _cursorBeats = 0
let currentSongTimeBeats = 0
let lastAudioContextTime = 0
let _justStarted = false
let songStartTimeSeconds = 0
/** Used for knowing when to restart */
let _playCount = 0

const makeSequencersInfo = () => Map<Id, {loopRatio: number}>()

let _sequencersInfo = makeSequencersInfo()

export function getSequencersSchedulerInfo() {
	return _sequencersInfo
}

export function getCurrentSongTime() {
	return _audioContext.currentTime - songStartTimeSeconds
}

export function getCurrentSongTimeBeats() {
	return currentSongTimeBeats
}

export function getCurrentSongIsPlaying() {
	return _isPlaying
}

function scheduleNotes(
	getAllInstruments: GetAllInstruments,
	getAllAudioNodes: GetAllAudioNodes,
) {
	const roomState = _store.getState().room

	const {
		isPlaying, bpm, maxReadAheadSeconds, playCount, startBeat,
	} = selectGlobalClockState(roomState)

	const actualBPM = Math.max(0.000001, bpm)
	const toBeats = (x: number) => x * (actualBPM / 60)
	const fromBeats = (x: number) => x * (60 / actualBPM)

	const currentAudioContextTime = _audioContext.currentTime

	if (isPlaying !== _isPlaying) {
		_isPlaying = isPlaying
		logger.log('[note-scanner] isPlaying: ', isPlaying)
		if (isPlaying) {
			_justStarted = true
			songStartTimeSeconds = currentAudioContextTime
			// getAllAudioNodes().forEach(x => x.syncOscillatorStartTimes(songStartTimeSeconds, bpm))
		} else {
			// song stopped
			// release all notes on all instruments
			releaseAllNotesOnAllInstruments(getAllInstruments)
			_sequencersInfo = makeSequencersInfo()
		}
	}

	if (isPlaying === false) return

	const isMasterClockEnabled = selectPosition(roomState, MASTER_CLOCK_SOURCE_ID).enabled

	if (isMasterClockEnabled !== _isMasterClockEnabled) {
		_isMasterClockEnabled = isMasterClockEnabled
		if (_isMasterClockEnabled) {
			lastAudioContextTime = currentAudioContextTime
		}
	}

	if (_isMasterClockEnabled === false) return

	const deltaTimeSeconds = currentAudioContextTime - lastAudioContextTime
	lastAudioContextTime = currentAudioContextTime

	const deltaBeats = toBeats(deltaTimeSeconds)

	currentSongTimeBeats += deltaBeats

	const restarted = _playCount !== playCount

	if (restarted) {
		releaseAllNotesOnAllInstruments(getAllInstruments)
	}

	if (_justStarted || restarted) {
		currentSongTimeBeats = startBeat
		_cursorBeats = startBeat
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

	const groupSequencers = selectAllGroupSequencers(roomState)

	// run all sequencers events thru scheduler
	const sequencersEvents = Map(selectAllSequencers(roomState))
		.filter(seq => selectSequencerIsPlaying(roomState, seq.id))
		.filter(seq => selectPosition(roomState, seq.id).enabled)
		.map(seq => ({
			seq,
			events: getEvents(seq.midiClip, readRangeBeats, seq.rate, restarted ? currentSongTimeBeats : undefined)
				.filter(getGroupEventsFilter(groupSequencers, roomState, seq.id, currentSongTimeBeats + offsetBeats))
				.map(event => applyGateToEvent(seq.gate, event))
				.map((event): MidiGlobalClipEvent => ({
					...event,
					note: event.note + Math.round(seq.pitch),
				}))
				.flatten() as List<MidiGlobalClipEvent>,
		}))

	_sequencersInfo = sequencersEvents.map(x => ({
		loopRatio: (currentSongTimeBeats % (x.seq.midiClip.length * x.seq.rate)) / (x.seq.midiClip.length * x.seq.rate),
	})).concat(
		Map(selectAllGroupSequencers(roomState))
			.map(x => {
				const totalLength = x.length * x.groupEventBeatLength
				return {loopRatio: (currentSongTimeBeats % totalLength) / totalLength}
			}),
	)

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
							mutableEvents.push({
								...event,
								sourceIds: Set([sourceId]),
							})
						})
					})
			})

		let scheduledNotesWithTimes = List<string>()

		eventsToSchedule.forEach(event => {
			if (event.note === -1) return

			if (event.startTime < 0) {
				logger.error(`event.startTime < 0: `, event.startTime)
				return
			}

			const delaySecondsUntilStart = (fromBeats(offsetBeats + event.startTime))

			if (delaySecondsUntilStart < 0) {
				logger.error(`delaySecondsUntilStart < 0: `, delaySecondsUntilStart)
				return
			}

			const delaySecondsUntilRelease = (fromBeats(offsetBeats + event.endTime))

			if (delaySecondsUntilRelease < 0) {
				logger.error(`delaySecondsUntilRelease < 0: `, delaySecondsUntilRelease)
				return
			}

			const slug = event.startTime.toString() + '-' + event.note.toString()

			if (scheduledNotesWithTimes.includes(slug)) return

			scheduledNotesWithTimes = scheduledNotesWithTimes.push(slug)

			instrument.scheduleNote(event.note, delaySecondsUntilStart, false, event.sourceIds, 1)
			instrument.scheduleRelease(event.note, delaySecondsUntilRelease)
		})

	})

	_cursorBeats += beatsToRead
	_justStarted = false
}

/** Filter events based on upstream group sequencers */
const getGroupEventsFilter = (groupSequencers: GroupSequencers, roomState: IClientRoomState, seqId: Id, currentBeats: number) => (event: MidiGlobalClipEvent): boolean => {
	const connectionsToSequencer = selectConnectionsWithTargetIds(roomState, seqId)
	const connectionSourceIds = connectionsToSequencer.map(x => x.sourceId)

	const sourceGroupSequencers = Map(groupSequencers).filter(x => connectionSourceIds.includes(x.id))

	// Sequencers should play if not connected to a group sequencer
	if (sourceGroupSequencers.count() === 0) return true

	// Sequencers should not play if all connected group sequencers are disabled
	if (sourceGroupSequencers.every(x => selectPosition(roomState, x.id).enabled === false)) return false

	return sourceGroupSequencers.some(groupSeq => {
		const portsUsed = connectionsToSequencer
			.filter(x => x.sourceId === groupSeq.id)
			.map(x => x.sourcePort)
			.toList()

		const groupTotalLengthBeats = groupSeq.length * groupSeq.groupEventBeatLength

		return groupSeq.groups.toList()
			.filter((_, i) => portsUsed.includes(i))
			.some(group => {
				return group.events
					.filter(x => x.on)
					.some(groupEvent => {
						const endBeat = groupEvent.startBeat + groupEvent.length
						const eventStartGlobal = currentBeats + event.startTime
						const eventStartGlobalActual = ((eventStartGlobal * midiPrecision) % (groupTotalLengthBeats * midiPrecision)) / midiPrecision

						return groupEvent.startBeat <= eventStartGlobalActual && eventStartGlobalActual < endBeat
					})
			})
	})
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

function releaseAllNotesOnAllInstruments(getAllInstruments: GetAllInstruments) {
	getAllInstruments().forEach(x => x.releaseAllScheduled())
}
