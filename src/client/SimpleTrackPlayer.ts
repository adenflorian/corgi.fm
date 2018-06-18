import {Dispatch} from 'redux'
import {logger} from '../common/logger'
import {IMidiNote} from './MIDI/MidiNote'
import {setSimpleTrackIndex} from './redux/simple-track-redux'
import {virtualAllKeysUp, virtualKeyPressed} from './redux/virtual-keyboard-redux'

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

const TRACK_1 = 'track-1'

export class SimpleTrackPlayer {
	private _audioContext: AudioContext
	private _intervalId: number
	private _index: number = 0
	private _dispatch: Dispatch
	private _events: ISimpleTrackEvent[]
	private _startTime: number
	private _inTick: boolean = false
	private _tick: number = 0

	constructor(dispatch: Dispatch, audioContext: AudioContext) {
		this._dispatch = dispatch
		this._audioContext = audioContext
	}

	public play = (events: ISimpleTrackEvent[]) => {
		if (this.isPlaying()) return
		logger.log('play')
		this._events = events
		this._startTime = this._audioContext.currentTime
		this._intervalId = window.setInterval(this._onTick, 10)
	}

	public setEvents = (events: ISimpleTrackEvent[]) => {
		if (this._events && events.length !== this._events.length) {
			throw new Error(`can't handle different events lengths yet in setEvents()`)
		}
		this._events = events
	}

	public stop = () => {
		clearInterval(this._intervalId)
		this._intervalId = undefined
		this._index = 0
		this._tick = 0
		this._stopAllNotes()
		this._dispatch(setSimpleTrackIndex(-1))
	}

	public getCurrentPlayTime() {
		return this._audioContext.currentTime - this._startTime
	}

	public isPlaying(): boolean {
		return this._intervalId !== undefined
	}

	private _onTick = () => {
		logger.debug('tick')
		this._tick++
		if (this._inTick === false) {
			this._inTick = true
			this._doTick()
			this._inTick = false
		}
	}

	private _doTick() {
		const nextEvent = this._events[this._index]
		const currentPlayTime = this.getCurrentPlayTime()
		logger.debug('_doTick, currentPlayTime: ', currentPlayTime)
		logger.debug('_doTick, nextEvent: ', nextEvent)
		if (this._tick % 10 === 0) {
			this._dispatch(setSimpleTrackIndex(Math.floor(currentPlayTime * 5)))
		}

		if (nextEvent.time <= currentPlayTime) {
			if (nextEvent.action === SimpleTrackEventAction.endTrack) {
				this._index = 0
				this._tick = 0
				this._startTime = this._audioContext.currentTime
			} else {
				this._doEvent(nextEvent)
				this._index++
			}
		}
	}

	private _doEvent(event: ISimpleTrackEvent) {
		logger.debug('_doEvent, event: ', event)
		switch (event.action) {
			case SimpleTrackEventAction.playNote: return this._playNotes(event.notes)
			case SimpleTrackEventAction.stopNote: return this._stopAllNotes()
			default: return logger.warn('unknown event note action')
		}
	}

	private _playNotes(notes: IMidiNote[]) {
		notes.forEach(note => this._dispatch(virtualKeyPressed(TRACK_1, note)))
	}

	// private _stopNotes(notes: IMidiNote[]) {
	// 	notes.forEach(note => this._dispatch(virtualKeyUp(TRACK_1, note)))
	// }

	private _stopAllNotes() {
		this._dispatch(virtualAllKeysUp(TRACK_1))
	}
}
