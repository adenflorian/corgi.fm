import {Record, List, Set} from 'immutable';
import {IMidiNotes, IMidiNote} from './MidiNote';

export type ClientId = string

export interface IDisposable {
	dispose: () => void
}

export interface Point {
	x: number
	y: number
}

export interface IConnectable {
	id: string
	color: string | false
	type: ConnectionNodeType
}

export interface IMultiStateThing extends IConnectable {
	id: string
	ownerId: string
}

export type IMultiStateThingDeserializer = (state: IMultiStateThing) => IMultiStateThing

export enum ConnectionNodeType {
	virtualKeyboard = 'virtualKeyboard',
	gridSequencer = 'gridSequencer',
	infiniteSequencer = 'infiniteSequencer',
	basicSynthesizer = 'basicSynthesizer',
	basicSampler = 'basicSampler',
	audioOutput = 'audioOutput',
	masterClock = 'masterClock',
	dummy = 'dummy',
	simpleReverb = 'simpleReverb',
}

export interface MidiEvent {
	notes: IMidiNotes
}

export function notesToNote(note: IMidiNote | IMidiNotes) {
	if (typeof note === 'number') {
		return note
	} else {
		return note.first(0)
	}
}

export interface MidiClipEvent extends MidiEvent {
	startBeat: number
}

export function makeMidiClipEvent(event: Partial<MidiClipEvent & {note: number}>): MidiClipEvent {
	const actualNotes = event.note !== undefined
		? Set([event.note])
		: event.notes !== undefined
			? event.notes
			: Set()

	return Object.freeze({
		startBeat: event.startBeat || 0,
		notes: actualNotes
	})
}

export function makeMidiGlobalClipEvent(event: Partial<MidiGlobalClipEvent & {note: number}>): MidiGlobalClipEvent {
	const actualNotes = event.note !== undefined
		? Set([event.note])
		: event.notes !== undefined
			? event.notes
			: Set()

	return Object.freeze({
		startTime: event.startTime || 0,
		notes: actualNotes
	})
}

export const makeMidiClip = Record({
	length: 4,
	loop: true,
	events: List<MidiClipEvent>(),
})

export type MidiClip = ReturnType<typeof makeMidiClip>

export type MidiClipEvents = MidiClip['events']

export interface MidiGlobalClipEvent extends MidiEvent {
	startTime: number
}

export const makeMidiGlobalClip = Record({
	length: 4,
	loop: true,
	events: List<MidiGlobalClipEvent>(),
})

export type MidiGlobalClip = ReturnType<typeof makeMidiGlobalClip>

export type MidiGlobalClipEvents = MidiGlobalClip['events']

const precision = 1000000

export class MidiRange {
	/** exclusive */
	public static readonly maxSafeNumber = 100000000
	public readonly end: number

	constructor(
		/** Always 0 or greater, defaults to 0 */
		public readonly start = 0,
		/** Always 0 or greater, defaults to 0 */
		public readonly length = 0,
	) {
		if (start < 0) throw new Error('start must be >= 0 | ' + JSON.stringify(this))
		if (length < 0) throw new Error('length must be >= 0 | ' + JSON.stringify(this))
		if (Math.max(this.start, this.start + this.length) >= MidiRange.maxSafeNumber) {
			throw new Error('too big | ' + JSON.stringify(this))
		}
		this.end = ((this.start * precision) + (this.length * precision)) / precision
	}

	public normalize(max: number) {
		return new MidiRange(
			((this.start * precision) % (max * precision) / precision),
			this.length,
		)
	}
}
