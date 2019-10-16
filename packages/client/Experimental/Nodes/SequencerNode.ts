/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {toBeats, fromBeats, oscillatorFreqCurveFunctions} from '@corgifm/common/common-utils'
import {preciseSubtract, preciseAdd, midiPrecision} from '@corgifm/common/midi-types'
import {maxPitchFrequency} from '@corgifm/common/common-constants'
import {logger} from '../../client-logger'
import {midiNoteToFrequency} from '../../WebAudio'
import {adsrValueToString} from '../../client-constants'
import {ExpCustomNumberParam, buildCustomNumberParamDesc} from '../ExpParams'
import {ExpGateOutputPort} from '../ExpGatePorts'
import {CorgiNode} from '../CorgiNode'
import {ExpNodeAudioOutputPort} from '../ExpPorts'

interface GateEvent {
	readonly gate: boolean
	readonly beat: number
	/** MIDI note number */
	readonly note?: number
}

interface NextEvent extends GateEvent {
	readonly distanceFromMainCursor: number
}

const myPrecision = 1000

// TODO Good candidate for writing in Rust?
class EventStreamReader {
	private _beatCursor = 0
	private readonly _eventStream = new EventStream()
	private _currentEvent: GateEvent

	public constructor() {
		this._currentEvent = this._eventStream.getNextEvent()
	}

	public read(beatsToRead: number): readonly NextEvent[] {
		if (beatsToRead <= 0) {
			return []
		}

		const readEvents: NextEvent[] = []

		let distanceFromMainCursor = Math.round((this._currentEvent.beat - this._beatCursor) * midiPrecision) / midiPrecision

		if (distanceFromMainCursor.toString().length > 8) logger.warn('precision error oh no A: ', {distanceFromMainCursor, ceb: this._currentEvent.beat, bc: this._beatCursor})

		while (distanceFromMainCursor < beatsToRead) {
			readEvents.push({
				...this._currentEvent,
				distanceFromMainCursor,
			})
			this._currentEvent = this._eventStream.getNextEvent()
			distanceFromMainCursor = Math.round((this._currentEvent.beat - this._beatCursor) * midiPrecision) / midiPrecision
			if (distanceFromMainCursor.toString().length > 8) logger.warn('precision error oh no B: ', {distanceFromMainCursor, ceb: this._currentEvent.beat, bc: this._beatCursor})
		}

		this._beatCursor = Math.round((this._beatCursor + beatsToRead) * myPrecision) / myPrecision

		return readEvents
	}
}

class EventStream {
	public readonly beatLength = 16
	private _currentIndex = -1
	private _loops = 0
	private readonly _events: readonly GateEvent[] = [
		{gate: true, beat: 0, note: 60},
		{gate: true, beat: 2, note: 63},
		{gate: true, beat: 3, note: 67},
		{gate: true, beat: 4, note: 60},
		{gate: true, beat: 6, note: 63},
		{gate: true, beat: 7, note: 67},
		{gate: true, beat: 7.5, note: 70},
		{gate: true, beat: 8, note: 69},
		{gate: true, beat: 9, note: 65},
		{gate: true, beat: 10, note: 63},
		{gate: true, beat: 10.5, note: 65},
		{gate: true, beat: 11, note: 67},
		{gate: true, beat: 12, note: 60},
		{gate: true, beat: 13, note: 58},
		{gate: true, beat: 13.5, note: 62},
		{gate: true, beat: 14, note: 60},
		{gate: false, beat: 15.5},
	]

	public getNextEvent(): GateEvent {
		this._currentIndex++

		if (this._currentIndex >= this._events.length) {
			this._loops++
			this._currentIndex = 0
		}

		const nextEvent = this._events[this._currentIndex]

		return {
			...nextEvent,
			beat: nextEvent.beat + (this._loops * this.beatLength),
		}
	}
}

export class SequencerNode extends CorgiNode {
	private _cursor: number
	private readonly _eventStream: EventStreamReader
	private readonly _gateOutputPort: ExpGateOutputPort
	private readonly _constantSourceNode: ConstantSourceNode
	private _startSongTime: number

	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		const constantSourceNode = audioContext.createConstantSource()
		constantSourceNode.offset.setValueAtTime(0, 0)
		constantSourceNode.start()

		const gateOutputPort = new ExpGateOutputPort('output', 'output', () => this)
		const pitchOutputPort = new ExpNodeAudioOutputPort('pitch', 'pitch', () => this, constantSourceNode, 'unipolar')

		super(id, audioContext, preMasterLimiter, {
			ports: [gateOutputPort, pitchOutputPort],
			customNumberParams: new Map<Id, ExpCustomNumberParam>([
				// TODO Store in private class field
				buildCustomNumberParamDesc('tempo', 240, 0.001, 999.99, 3),
				buildCustomNumberParamDesc('portamento', 0, 0, 8, 3, adsrValueToString),
			]),
		})

		this._startSongTime = -1

		this._gateOutputPort = gateOutputPort

		this._cursor = 0
		this._eventStream = new EventStreamReader()

		// Make sure to add these to the dispose method!
		this._constantSourceNode = constantSourceNode
	}

	public getColor(): string {return CssColor.green}
	public getName() {return 'Sequencer'}

	private get _tempo() {return this._customNumberParams.get('tempo')!.value}
	private get _portamento() {return this._customNumberParams.get('portamento')!.value}

	public render() {return this.getDebugView()}

	public onTick(currentGlobalTime: number, maxReadAhead: number) {
		super.onTick(currentGlobalTime, maxReadAhead)
		if (!this._enabled) return

		if (this._startSongTime < 0) {
			this._startSongTime = Math.ceil((currentGlobalTime + 0.1) * 10) / 10
		}

		const cursor = this._cursor
		const songStartTime = this._startSongTime
		const tempo = this._tempo
		const currentSongTime = preciseSubtract(currentGlobalTime, songStartTime)
		const targetSongTimeToReadTo = Math.ceil(preciseAdd(currentSongTime, maxReadAhead) * myPrecision) / myPrecision
		const distanceSeconds = Math.round(preciseSubtract(targetSongTimeToReadTo, cursor) * myPrecision) / myPrecision

		if (distanceSeconds <= 0) return

		const distanceBeats = toBeats(distanceSeconds, tempo)
		const events = this._eventStream.read(distanceBeats)

		events.forEach(event => {
			const eventDistanceFromCursor = event.distanceFromMainCursor
			const fromBeats_ = fromBeats(eventDistanceFromCursor, tempo)
			const songStartPlusCursor = Math.round((songStartTime + cursor) * myPrecision) / myPrecision
			const eventStart = Math.round((songStartPlusCursor + fromBeats_) * myPrecision) / myPrecision

			if (eventStart.toString().length > 8) logger.warn('precision error oh no: ', {eventDistanceFromCursor, fromBeats_, songStartPlusCursor, eventStart})

			this._gateOutputPort.sendGateSignal(event.gate, eventStart)

			if (event.note !== undefined) {
				const frequency = midiNoteToFrequency(event.note)
				const normalized = oscillatorFreqCurveFunctions.unCurve(frequency / maxPitchFrequency)
				this._constantSourceNode.offset.setTargetAtTime(normalized, eventStart, this._portamento)
			}
		})

		this._cursor = targetSongTimeToReadTo
	}

	protected _enable() {
	}

	protected _disable() {
		this._gateOutputPort.sendGateSignal(false, this._startSongTime + this._cursor)
		this._startSongTime = -1
		this._cursor = 0
	}

	protected _dispose() {
		this._constantSourceNode.stop()
		this._constantSourceNode.disconnect()
	}
}
