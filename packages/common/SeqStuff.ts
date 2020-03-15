import * as Immutable from 'immutable'
import * as uuid from 'uuid'
import {MidiRange} from '@corgifm/common/midi-types'
import {logger} from './logger'
import {NoteNameSharps, NoteNameFlats} from './common-types'
import {midiNoteFromNoteName} from './common-samples-stuff'

export type SeqEvent = SeqNoteEvent

export interface SeqEventBase {
	readonly id: Id
	readonly startBeat: number
	readonly type: SeqEventType
	readonly active: boolean
}

export interface SeqNoteEvent extends SeqEventBase {
	readonly type: 'note'
	readonly duration: number
	readonly velocity: number
	readonly note: number
}

export function makeNoteEvent(noteName: NoteNameSharps | NoteNameFlats, octave: Octave, startBeat: number, duration: number): SeqNoteEvent {
	return {
		id: uuid.v4(),
		active: true,
		startBeat,
		type: 'note',
		duration,
		velocity: 1,
		note: midiNoteFromNoteName(noteName, octave),
	}
}

export function makeNoteEvent2(note: number, startBeat: number, duration: number): SeqNoteEvent {
	return {
		id: uuid.v4(),
		active: true,
		startBeat,
		type: 'note',
		duration,
		velocity: 1,
		note,
	}
}

export function duplicateNoteEvent(event: SeqNoteEvent): SeqNoteEvent {
	return {
		...event,
		id: uuid.v4(),
	}
}

export type SeqEvents = Immutable.Map<Id, SeqEvent>



export function SeqEvents(): SeqEvents {
	return Immutable.Map<Id, SeqEvent>()
}

export type SeqReadEvent = SeqReadNoteOffEvent | SeqReadNoteOnEvent

export interface SeqReadEventBase {
	readonly id: Id
	readonly offsetBeats: number
	readonly type: SeqReadEventType
}

export type SeqReadEventType = 'noteOn' | 'noteOff'

export interface SeqReadNoteOnEvent extends SeqReadEventBase {
	readonly type: 'noteOn'
	readonly velocity: number
	readonly note: number
}

export interface SeqReadNoteOffEvent extends SeqReadEventBase {
	readonly type: 'noteOff'
	readonly note: number
}

export interface SeqPattern {
	readonly id: Id
	readonly events: SeqEvents
	readonly name: string
}

export interface SeqPatternView {
	readonly id: Id
	readonly startBeat: number
	readonly endBeat: number
	readonly loopStartBeat: number
	readonly loopEndBeat: number
	readonly pattern: SeqPattern
	readonly name: string
}

export function makeSeqPattern(): SeqPattern {
	return {
		id: uuid.v4(),
		events: SeqEvents(),
		name: 'defaultSeqPattern',
	}
}

export function makeSeqPatternView(): SeqPatternView {
	return {
		id: uuid.v4(),
		startBeat: 0,
		endBeat: 4,
		loopStartBeat: 0.,
		loopEndBeat: 4,
		pattern: makeSeqPattern(),
		name: 'defaultSeqPatternView',
	}
}

export function seqPatternReader(range: MidiRange, pattern: SeqPattern): readonly SeqReadEvent[] {
	const noteOnEvents = pattern.events
		.filter(x => x.startBeat >= range.start && x.startBeat < range.end)
		.map((x): SeqReadEvent => ({
			id: x.id,
			offsetBeats: x.startBeat - range.start,
			type: 'noteOn',
			velocity: x.velocity,
			note: x.note,
		})).valueSeq().toArray()

	const noteOffEvents = pattern.events
		.filter(x => (x.startBeat + x.duration) > range.start && (x.startBeat + x.duration) <= range.end)
		.map((x): SeqReadEvent => ({
			id: x.id,
			offsetBeats: (x.startBeat + x.duration) - range.start,
			type: 'noteOff',
			note: x.note,
		})).valueSeq().toArray()

	const events = noteOnEvents.concat(noteOffEvents)

	if (events.some(x => x.offsetBeats < 0)) {
		throw new Error('events.some(x => x.offsetBeats < 0): ' + JSON.stringify({range, pattern, events}))
	}

	return events
}

export function seqPatternViewReader(range: MidiRange, patternView: SeqPatternView, loops = 0): readonly SeqReadEvent[] {
	const a = range.start % patternView.loopEndBeat
	const b = range.end - (range.start - a)
	logger.assert(b > a, 'no sir', {loops, a, b, range, patternView})

	if (b <= patternView.loopEndBeat) {
		// Range fits within loop, so we're done
		const rangeA = new MidiRange(a, b - a)
		const eventsA = seqPatternReader(rangeA, patternView.pattern)
		return eventsA
	} else {
		// Range does not fit, so have to call ourselves with the leftover range
		const lengthA = patternView.loopEndBeat - a
		const rangeA = new MidiRange(a, patternView.loopEndBeat - a)
		const lengthB = range.length - lengthA
		logger.assert(lengthB > 0, 'uh no plz', {loops, range, patternView, a, b, lengthA, rangeA, lengthB})
		const rangeB = new MidiRange(patternView.loopStartBeat, lengthB)
		const eventsA = seqPatternReader(rangeA, patternView.pattern)
		const eventsB = seqPatternViewReader(rangeB, patternView, loops + 1)
		return eventsA.concat(eventsB.map(x => ({...x, offsetBeats: x.offsetBeats + lengthA})))
	}
}

export interface SeqTimelineClip {
	readonly id: Id
	readonly startBeat: number
	readonly beatLength: number
	readonly active: boolean
	readonly patternView: SeqPatternView
	readonly name: string
}

export interface SeqTimelineTrack {
	readonly id: Id
	readonly timelineClipIds: Immutable.Set<Id>
	readonly active: boolean
	readonly solo: boolean
	readonly armed: boolean
	readonly name: string
}

export interface SeqTimelineArrangement {
	readonly id: Id
	readonly loopStartBeat: number
	readonly loopEndBeat: number
	readonly timelineTrackIds: Immutable.Set<Id>
	readonly playFromMarkerInBeats: number
	readonly name: string
}

export interface SeqSessionClip {
	readonly id: Id
	readonly patternView: SeqPatternView
	readonly launchMode: SeqSessionClipLaunchMode
	readonly channelId: Id
	readonly sceneId: Id
	readonly active: boolean
	readonly name: string
}

export interface SeqSession {
	readonly id: Id
	readonly sessionClips: Immutable.Set<SeqSessionClip>
	readonly name: string
}

export function seqSessionClipReader(range: MidiRange, clip: SeqSessionClip): readonly SeqReadEvent[] {
	return seqPatternViewReader(range, clip.patternView)
}

export function seqSessionReader(range: MidiRange, session: SeqSession): readonly SeqReadEvent[] {
	return session.sessionClips.map(x => seqSessionClipReader(range, x)).toArray().flat(1)
}

export interface Sequencer {
	readonly id: Id
	readonly name: string
}

export interface SeqGlobal {
	readonly currentAudioTime: number
	readonly tempo: number
	readonly songStartTime: number
	readonly songStartOffsetInBeats: number
}

type SeqSessionClipLaunchMode = 'trigger'

type SeqEventType = 'note'