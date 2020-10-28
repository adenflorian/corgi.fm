import {SequencerEvents, SequencerEvent, SequencerEventExtra} from '@corgifm/common/midi-types'
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

	public restart() {
		this._beatCursor.invokeNextFrame(0)
		this._eventStream.restart()
		this._currentEvent.invokeNextFrame(this._eventStream.getNextEvent())
	}

	public changeEvents(events: SequencerEvents) {
		this._eventStream.changeEvents(events)
	}

	public read(beatsToRead: number): readonly NextEvent[] {
		if (beatsToRead <= 0) {
			return []
		}

		const readEvents: NextEvent[] = []

		let distanceFromMainCursor = Math.round((this._currentEvent.current.beat - this._beatCursor.current) * midiPrecision) / midiPrecision

		if (distanceFromMainCursor < 0) {
			logger.error('EventStreamReader.read distanceFromMainCursor < 0 AAA:', {distanceFromMainCursor, currentEvent: this._currentEvent.current, beatCursor: this._beatCursor.current})
		}

		if (distanceFromMainCursor.toString().length > 8) logger.warn('precision error oh no A: ', {distanceFromMainCursor, ceb: this._currentEvent.current.beat, bc: this._beatCursor.current})

		while (distanceFromMainCursor < beatsToRead) {
			readEvents.push({
				...this._currentEvent.current,
				distanceFromMainCursor,
			})
			this._currentEvent.invokeNextFrame(this._eventStream.getNextEvent())
			distanceFromMainCursor = Math.round((this._currentEvent.current.beat - this._beatCursor.current) * midiPrecision) / midiPrecision
			if (distanceFromMainCursor < 0) {
				logger.error('EventStreamReader.read distanceFromMainCursor < 0 BBB:', {distanceFromMainCursor, currentEvent: this._currentEvent.current, beatCursor: this._beatCursor.current})
			}
			if (distanceFromMainCursor.toString().length > 8) logger.warn('precision error oh no B: ', {distanceFromMainCursor, ceb: this._currentEvent.current.beat, bc: this._beatCursor.current})
		}

		this._beatCursor.invokeNextFrame(Math.round((this._beatCursor.current + beatsToRead) * myPrecision) / myPrecision)

		return readEvents
	}
}

export type ReadonlyEventStream = Pick<EventStream, 'beatLength' | 'beatCursor' | 'beatCursor2' | 'currentIndex' | 'loops' | 'events'>

const beatLength = 16

export class EventStream {
	public get beatLength() {return this._beatLength as ReadonlyCorgiNumberChangedEvent}
	public get currentIndex() {return this._currentIndex as ReadonlyCorgiNumberChangedEvent}
	public get loops() {return this._loops as ReadonlyCorgiNumberChangedEvent}
	public get beatCursor() {return this._beatCursor as ReadonlyCorgiNumberChangedEvent}
	public get beatCursor2() {return this._beatCursor2 as ReadonlyCorgiNumberChangedEvent}
	public get events() {return this._events as ReadonlyCorgiObjectChangedEvent<SequencerEvents>}
	public get lastEvent() {return this._lastEvent as ReadonlyCorgiObjectChangedEvent<SequencerEventExtra>}
	private readonly _beatLength = new CorgiNumberChangedEvent(beatLength)
	private readonly _currentIndex = new CorgiNumberChangedEvent(-1)
	private readonly _loops = new CorgiNumberChangedEvent(0)
	private readonly _beatCursor = new CorgiNumberChangedEvent(0)
	private readonly _beatCursor2 = new CorgiNumberChangedEvent(0)
	private readonly _events = new CorgiObjectChangedEvent<SequencerEvents>(songOfTime)
	private readonly _lastEvent = new CorgiObjectChangedEvent<SequencerEventExtra>({beat: 0, gate: false, loop: 0})

	public changeEvents(events: SequencerEvents) {
		this._events.invokeImmediately(events)
		this.restart()
	}

	public restart() {
		this._beatLength.invokeNextFrame(beatLength)
		this._currentIndex.invokeNextFrame(-1)
		this._loops.invokeNextFrame(0)
		this._beatCursor.invokeNextFrame(0)
		this._beatCursor2.invokeNextFrame(0)
		// this._events.invokeNextFrame(0)
		this._lastEvent.invokeNextFrame({beat: 0, gate: false, loop: 0})
	}

	public getNextEvent(): SequencerEvent {
		this._currentIndex.invokeNextFrame(this.currentIndex.current + 1)

		if (this._currentIndex.current >= this._events.current.length) {
			console.log('A:', {loops: this._loops.current})
			this._loops.invokeNextFrame(this._loops.current + 1)
			console.log('B:', {loops: this._loops.current})
			this._currentIndex.invokeNextFrame(0)
		}

		const bar = this._events.current[this._currentIndex.current]

		const nextEvent: SequencerEventExtra = {
			...bar,
			loop: this.loops.current,
		}

		logger.assert(nextEvent.loop >= this.lastEvent.current.loop, 'oof', {nextEvent, lastEvent: this.lastEvent})

		const foo = nextEvent.loop > this.lastEvent.current.loop
			? this._beatLength.current - this.lastEvent.current.beat + nextEvent.beat
			: nextEvent.beat - this.lastEvent.current.beat

		this._beatCursor.invokeNextFrame(this._beatCursor.current + foo)

		this._beatCursor2.invokeNextFrame(nextEvent.beat + (this._loops.current * this.beatLength.current))

		this._lastEvent.invokeNextFrame(nextEvent)

		return {
			...nextEvent,
			beat: nextEvent.beat + (this._loops.current * this.beatLength.current),
		}
	}
}

export const songOfTime: SequencerEvents = [
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
