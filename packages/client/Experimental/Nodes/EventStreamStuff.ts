import {SequencerEvents, SequencerEvent} from '@corgifm/common/midi-types'
import {midiPrecision} from '@corgifm/common/midi-types'
import {logger} from '../../client-logger'
import {
	CorgiNumberChangedEvent, CorgiObjectChangedEvent,
	ReadonlyCorgiNumberChangedEvent, ReadonlyCorgiObjectChangedEvent,
} from '../CorgiEvents'


export const myPrecision = 1000

export interface NextEvent extends SequencerEvent {
	readonly distanceFromMainCursor: number
}

export type ReadonlyEventStreamReader = Pick<EventStreamReader, 'beatCursor' | 'currentEvent' | 'eventStream'>

export class EventStreamReader {
	private readonly _beatCursor = new CorgiNumberChangedEvent(0)
	public get beatCursor() {return this._beatCursor as ReadonlyCorgiNumberChangedEvent}
	private readonly _eventStream = new EventStream()
	public get eventStream() {return this._eventStream as ReadonlyEventStream}
	private readonly _currentEvent: CorgiObjectChangedEvent<SequencerEvent>
	public get currentEvent() {return this._currentEvent as ReadonlyCorgiObjectChangedEvent<SequencerEvent>}

	public constructor() {
		this._currentEvent = new CorgiObjectChangedEvent<SequencerEvent>(this._eventStream.getNextEvent())
	}

	public read(beatsToRead: number): readonly NextEvent[] {
		if (beatsToRead <= 0) {
			return []
		}

		const readEvents: NextEvent[] = []

		let distanceFromMainCursor = Math.round((this._currentEvent.current.beat - this._beatCursor.current) * midiPrecision) / midiPrecision

		if (distanceFromMainCursor.toString().length > 8) logger.warn('precision error oh no A: ', {distanceFromMainCursor, ceb: this._currentEvent.current.beat, bc: this._beatCursor.current})

		while (distanceFromMainCursor < beatsToRead) {
			readEvents.push({
				...this._currentEvent.current,
				distanceFromMainCursor,
			})
			this._currentEvent.invokeNextFrame(this._eventStream.getNextEvent())
			distanceFromMainCursor = Math.round((this._currentEvent.current.beat - this._beatCursor.current) * midiPrecision) / midiPrecision
			if (distanceFromMainCursor.toString().length > 8) logger.warn('precision error oh no B: ', {distanceFromMainCursor, ceb: this._currentEvent.current.beat, bc: this._beatCursor.current})
		}

		this._beatCursor.invokeNextFrame(Math.round((this._beatCursor.current + beatsToRead) * myPrecision) / myPrecision)

		return readEvents
	}
}

export type ReadonlyEventStream = Pick<EventStream, 'beatLength' | 'beatCursor' | 'currentIndex' | 'loops' | 'events'>

export class EventStream {
	public get beatLength() {return this._beatLength as ReadonlyCorgiNumberChangedEvent}
	public get currentIndex() {return this._currentIndex as ReadonlyCorgiNumberChangedEvent}
	public get loops() {return this._loops as ReadonlyCorgiNumberChangedEvent}
	public get beatCursor() {return this._beatCursor as ReadonlyCorgiNumberChangedEvent}
	public get events() {return this._events as ReadonlyCorgiObjectChangedEvent<SequencerEvents>}
	private readonly _beatLength = new CorgiNumberChangedEvent(16)
	private readonly _currentIndex = new CorgiNumberChangedEvent(-1)
	private readonly _loops = new CorgiNumberChangedEvent(0)
	private readonly _beatCursor = new CorgiNumberChangedEvent(0)
	private readonly _events = new CorgiObjectChangedEvent<SequencerEvents>(songOfTime)

	public getNextEvent(): SequencerEvent {
		this._currentIndex.invokeNextFrame(this.currentIndex.current + 1)

		if (this._currentIndex.current >= this._events.current.length) {
			this._loops.invokeNextFrame(this._loops.current + 1)
			this._currentIndex.invokeNextFrame(0)
		}

		const nextEvent = this._events.current[this._currentIndex.current]

		return {
			...nextEvent,
			beat: nextEvent.beat + (this._loops.current * this.beatLength.current),
		}
	}
}

const songOfTime: SequencerEvents = [
	// {gate: true, beat: 0, note: 60},
	// {gate: false, beat: 1, note: 60},
	// {gate: true, beat: 2, note: 65},
	// {gate: false, beat: 3, note: 65},

	{gate: true, beat: 0, note: 60},
	{gate: true, beat: 0, note: 48},
	{gate: false, beat: 1, note: 60},
	{gate: true, beat: 2, note: 63},
	{gate: false, beat: 3, note: 63},
	{gate: true, beat: 3, note: 67},
	{gate: false, beat: 3.5, note: 48},
	{gate: false, beat: 4, note: 67},
	{gate: true, beat: 4, note: 60},
	{gate: true, beat: 4, note: 51},
	{gate: false, beat: 5, note: 60},
	{gate: true, beat: 6, note: 63},
	{gate: false, beat: 7, note: 63},
	{gate: true, beat: 7, note: 67},
	{gate: false, beat: 7.5, note: 51},
	{gate: true, beat: 7.5, note: 70},
	{gate: false, beat: 8, note: 67},
	{gate: true, beat: 8, note: 69},
	{gate: true, beat: 8, note: 53},
	{gate: false, beat: 8.5, note: 70},
	{gate: false, beat: 9, note: 69},
	{gate: true, beat: 9, note: 65},
	{gate: false, beat: 10, note: 65},
	{gate: true, beat: 10, note: 63},
	{gate: true, beat: 10.5, note: 65},
	{gate: false, beat: 11, note: 63},
	{gate: true, beat: 11, note: 67},
	{gate: false, beat: 11.5, note: 53},
	{gate: false, beat: 11.5, note: 65},
	{gate: false, beat: 12, note: 67},
	{gate: true, beat: 12, note: 60},
	{gate: true, beat: 12, note: 55},
	{gate: false, beat: 13, note: 60},
	{gate: true, beat: 13, note: 58},
	{gate: true, beat: 13.5, note: 62},
	{gate: false, beat: 14, note: 58},
	{gate: true, beat: 14, note: 60},
	{gate: false, beat: 14.5, note: 62},
	{gate: false, beat: 15, note: 60},
	{gate: false, beat: 15.5, note: 55},
	{gate: false, beat: 15.5},
]
