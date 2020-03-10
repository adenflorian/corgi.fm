import * as Immutable from 'immutable'
import {MidiRange} from '@corgifm/common/midi-types'
import {logger} from '../../client-logger'

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

export type SeqEvents = Immutable.Map<Id, SeqEvent>

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
}

export interface SeqPatternView {
	readonly id: Id
	readonly startBeat: number
	readonly endBeat: number
	readonly loopStartBeat: number
	readonly loopEndBeat: number
	readonly pattern: SeqPattern
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

export function seqPatternViewReader(range: MidiRange, patternView: SeqPatternView): readonly SeqReadEvent[] {
	const a = range.start % patternView.loopEndBeat
	const b = range.end - (range.start - a)
	logger.assert(b > a, 'no sir', {a, b, range, patternView})

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
		logger.assert(lengthB > 0, 'uh no plz', {range, patternView, a, b, lengthA, rangeA, lengthB})
		const rangeB = new MidiRange(patternView.loopStartBeat, lengthB)
		const eventsA = seqPatternReader(rangeA, patternView.pattern)
		const eventsB = seqPatternViewReader(rangeB, patternView)
		return eventsA.concat(eventsB.map(x => ({...x, offsetBeats: x.offsetBeats + lengthA})))
	}
}

export interface SeqTimelineClip {
	readonly id: Id
	readonly startBeat: number
	readonly beatLength: number
	readonly active: boolean
	readonly patternView: SeqPatternView
}

export interface SeqTimelineTrack {
	readonly id: Id
	readonly timelineClipIds: Immutable.Set<Id>
	readonly active: boolean
	readonly solo: boolean
	readonly armed: boolean
}

export interface SeqTimelineArrangement {
	readonly id: Id
	readonly loopStartBeat: number
	readonly loopEndBeat: number
	readonly timelineTrackIds: Immutable.Set<Id>
	readonly playFromMarkerInBeats: number
}

export interface SeqSessionClip {
	readonly id: Id
	readonly patternViewId: Id
	readonly launchMode: SeqSessionClipLaunchMode
	readonly channelId: Id
	readonly sceneId: Id
	readonly active: boolean
}

export interface SeqSession {
	readonly id: Id
	readonly sessionClipIds: Immutable.Set<Id>
}

export interface Sequencer {
	readonly id: Id
}

export interface SeqGlobal {
	readonly currentAudioTime: number
	readonly tempo: number
	readonly songStartTime: number
	readonly songStartOffsetInBeats: number
}

type SeqSessionClipLaunchMode = 'trigger'

type SeqEventType = 'note'