import {logger} from '../common/logger'
import {IMidiNote} from '../common/MidiNote'

export enum SimpleTrackEventAction {
	playNote,
	stopNote,
	endTrack,
}

export interface ISimpleTrackEvent {
	time: number
	action: SimpleTrackEventAction
	notes?: IMidiNote[]
}

export type IndexChangeHandler = (newIndex: number) => any

export class TrackPlayer {
	private _audioContext: AudioContext
	private _index: number = 0
	private _events: ISimpleTrackEvent[]
	private _startTime: number
	private _inTick: boolean = false
	private _tick: number = 0
	private _isPlaying: boolean = false
	private _onIndexChange: IndexChangeHandler

	constructor(audioContext: AudioContext, onIndexChange: IndexChangeHandler) {
		this._audioContext = audioContext
		this._onIndexChange = onIndexChange
	}

	public play = (events: ISimpleTrackEvent[]) => {
		if (this.isPlaying()) return
		logger.log('play')
		this._events = events
		this._startTime = this._audioContext.currentTime
		this._isPlaying = true
		window.requestAnimationFrame(this._onTick)
	}

	public setEvents = (events: ISimpleTrackEvent[]) => {
		if (this._events && events.length !== this._events.length) {
			throw new Error(`can't handle different events lengths yet in setEvents()`)
		}
		this._events = events
	}

	public stop = () => {
		this._isPlaying = false
		this._index = 0
		this._tick = 0
		this._onIndexChange(-1)
	}

	public getCurrentPlayTime() {
		return this._audioContext.currentTime - this._startTime
	}

	public isPlaying(): boolean {
		return this._isPlaying
	}

	private _onTick = () => {
		logger.debug('tick')
		this._tick++
		if (this._inTick === false) {
			this._inTick = true
			this._doTick()
			this._inTick = false
		}
		if (this._isPlaying) {
			window.requestAnimationFrame(this._onTick)
		} else {
			this._stopAllNotes()
		}
	}

	private _doTick() {
		const nextEvent = this._events[this._index]
		const currentPlayTime = this.getCurrentPlayTime()
		logger.debug('_doTick, currentPlayTime: ', currentPlayTime)
		logger.debug('_doTick, nextEvent: ', nextEvent)
		if (this._tick % 10 === 0) {
			this._onIndexChange(Math.floor(currentPlayTime * 5))
		}

		if (nextEvent.time <= currentPlayTime) {
			if (nextEvent.action === SimpleTrackEventAction.endTrack) {
				this._index = 0
				this._tick = 0
				this._startTime = this._audioContext.currentTime
			} else {
				// this._doEvent(nextEvent)
				this._index++
			}
		}
	}

	// private _doEvent(event: ISimpleTrackEvent) {
	// 	logger.debug('_doEvent, event: ', event)
	// 	// switch (event.action) {
	// 	// 	case SimpleTrackEventAction.playNote: return this._playNotes(event.notes)
	// 	// 	case SimpleTrackEventAction.stopNote: return this._stopAllNotes()
	// 	// 	default: return logger.warn('unknown event note action')
	// 	// }
	// }

	// private _playNotes(notes: IMidiNote[]) {
	// 	// notes.forEach(note => this._dispatch(virtualKeyPressed(TRACK_1, note)))
	// }

	// private _stopNotes(notes: IMidiNote[]) {
	// 	notes.forEach(note => this._dispatch(virtualKeyUp(TRACK_1, note)))
	// }

	private _stopAllNotes() {
		// this._dispatch(virtualAllKeysUp(TRACK_1))
	}
}
