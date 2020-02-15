import * as uuid from 'uuid'
import * as Immutable from 'immutable'
import {List, Record, OrderedMap} from 'immutable'
import {IMidiNote} from './MidiNote'

/** V2, In clip time (beats); Means BPM has not been applied */
export interface MidiClipEvent {
	readonly note: IMidiNote
	readonly startBeat: number
	readonly durationBeats: number
	readonly id: Id
}

export interface MidiClipEventV1 {
	readonly notes: Set<IMidiNote>
	readonly startBeat: number
	readonly durationBeats: number
}

/** In clip time (beats); Means BPM has not been applied */
export function makeMidiClipEvent(event: Omit<MidiClipEvent, 'id'>): MidiClipEvent {
	if (event.note === undefined) throw new Error('why1')
	if (event.startBeat === undefined) throw new Error('why2')
	if (event.durationBeats === undefined) throw new Error('why3')

	return {
		note: event.note,
		startBeat: event.startBeat,
		durationBeats: event.durationBeats,
		id: uuid.v4(),
	}
}

export const makeMidiClip = Record({
	version: '2' as const,
	length: 0,
	loop: false,
	events: OrderedMap<Id, MidiClipEvent>(),
})

export function makeEvents(events = List<MidiClipEvent>()) {
	return events.reduce((map, event) => {
		return map.set(event.id, event)
	}, OrderedMap<Id, MidiClipEvent>())
}

/** In clip time (beats); Means BPM has not been applied */
export class MidiClip extends makeMidiClip {}

export interface MidiClipV1 {
	readonly length: number
	readonly loop: boolean
	readonly events: List<MidiClipEventV1>
	readonly version: undefined
}

/** In clip time (beats); Means BPM has not been applied */
export type MidiClipEvents = MidiClip['events']

export function MidiClipEvents() {
	return OrderedMap<Id, MidiClipEvent>()
}

// Start Global Midi Types

/** In audio context time (seconds); Means BPM is already applied */
export interface MidiGlobalClipEvent {
	readonly note: IMidiNote
	readonly startTime: number
	readonly endTime: number
	readonly id: Id
}

export function makeMidiGlobalClipEvent(event: MidiGlobalClipEvent): MidiGlobalClipEvent {
	if (event.note === undefined) throw new Error('why1')
	if (event.startTime === undefined) throw new Error('why2')
	if (event.endTime === undefined) throw new Error('why3')
	if (event.id === undefined) throw new Error('why4')

	return {
		note: event.note,
		startTime: event.startTime,
		endTime: event.endTime,
		id: event.id,
	}
}

export function makeMidiGlobalClipEvents(events: List<MidiGlobalClipEvent>): MidiGlobalClipEvents {
	return events.reduce((result, event) => {
		return result.set(event.id, event)
	}, OrderedMap<Id, MidiGlobalClipEvent>())
}

/** In audio context time (seconds); Means BPM is already applied */
export const makeMidiGlobalClip = Record({
	version: '2',
	length: 4,
	loop: true,
	events: OrderedMap<Id, MidiGlobalClipEvent>(),
})

/** In audio context time (seconds); Means BPM is already applied */
export type MidiGlobalClip = ReturnType<typeof makeMidiGlobalClip>

/** In audio context time (seconds); Means BPM is already applied */
export type MidiGlobalClipEvents = MidiGlobalClip['events']

// Midi Range

/** Multiply things by  this number before doing math with it */
export const midiPrecision = 1000000

export function preciseModulus(a: number, b: number) {
	return ((a * midiPrecision) % (b * midiPrecision)) / midiPrecision
}

export function preciseSubtract(a: number, b: number): number {
	return ((a * midiPrecision) - (b * midiPrecision)) / midiPrecision
}

export function preciseAdd(a: number, b: number): number {
	return ((a * midiPrecision) + (b * midiPrecision)) / midiPrecision
}

export function preciseMultiply(a: number, b: number): number {
	return ((a * midiPrecision) * (b * midiPrecision)) / midiPrecision
}

export function preciseDivide(a: number, b: number): number {
	return ((a * midiPrecision) / (b * midiPrecision)) / midiPrecision
}

export function preciseRound(a: number, precision: number = midiPrecision): number {
	return Math.round(a * precision) / precision
}

export function preciseCeil(a: number, precision: number = midiPrecision): number {
	return Math.ceil(a * precision) / precision
}

export class MidiRange {
	/** exclusive */
	public static readonly maxSafeNumber = 100000000
	public readonly end: number

	public constructor(
		/** Always 0 or greater, defaults to 0 */
		public readonly start = 0,
		/** Always 0 or greater, defaults to 0 */
		public readonly length = 0,
	) {
		if (start < 0) throw new Error('start must be >= 0 | ' + JSON.stringify(this))
		if (length < 0) throw new Error('length must be >= 0 | ' + JSON.stringify(this))

		if (start === null || length === null) throw new Error('y r u null | ' + JSON.stringify(this))

		if (Math.max(this.start, this.start + this.length) >= MidiRange.maxSafeNumber) {
			throw new Error('too big | ' + JSON.stringify(this))
		}
		this.end = ((this.start * midiPrecision) + (this.length * midiPrecision)) / midiPrecision
	}

	public normalize(max: number) {
		return new MidiRange(
			// TODO
			// eslint-disable-next-line no-mixed-operators
			((this.start * midiPrecision) % (max * midiPrecision) / midiPrecision),
			this.length,
		)
	}
}

// Exp
export interface ExpMidiClip {
	readonly events: ExpMidiEvents
}

export type ExpMidiEvents = Immutable.Map<Id, ExpMidiEvent>

interface ExpMidiEventBase {
	readonly type: ExpMidiEventType
	readonly id: Id
	readonly startBeat: number
	readonly durationBeats: number
}

export interface ExpMidiNoteEvent extends ExpMidiEventBase {
	readonly type: ExpMidiEventType.Note
	readonly noteNumber: number
	readonly velocity: number
}

export type ExpMidiEvent = ExpMidiNoteEvent	// | ExpOtherMidiEvent

export enum ExpMidiEventType {
	Note = 0,
}

export function makeExpMidiClip(events?: ExpMidiEvents): ExpMidiClip {
	return {
		events: makeExpMidiEvents(events),
	}
}

export function makeExpMidiEvents(events?: ExpMidiEvents): ExpMidiEvents {
	return events ? Immutable.Map(events) : Immutable.Map()
}

export function makeExpMidiEventsFromArray(events: readonly Omit<ExpMidiEvent, 'id'>[]): ExpMidiEvents {
	return Immutable.Map(events.map(x => {
		const newId = uuid.v4()
		return [newId, {...x, id: newId}]
	}))
}

export function makeExpMidiNoteEvent(startBeat: number, durationBeats: number, noteNumber: number, velocity: number): ExpMidiNoteEvent {
	return {
		id: uuid.v4(),
		type: ExpMidiEventType.Note,
		startBeat,
		durationBeats,
		noteNumber,
		velocity,
	}
}

export interface SequencerEvent {
	readonly gate: boolean
	readonly beat: number
	/** MIDI note number */
	readonly note?: number
}

export type SequencerEvents = readonly SequencerEvent[]

export function convertExpMidiEventsToSequencerEvents(events: ExpMidiEvents): SequencerEvents {
	return []
}
