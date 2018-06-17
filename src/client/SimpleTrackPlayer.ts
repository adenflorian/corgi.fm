import {Dispatch} from 'redux'
import {logger} from './logger'
import {setSimpleTrackIndex} from './redux/simple-track-redux'
import {virtualKeyPressed, virtualKeyUp} from './redux/virtual-keyboard-redux'

export enum SimpleTrackEventAction {
	playNote,
	stopNote,
	endTrack,
}

export interface SimpleTrackEvent {
	time: number
	action: SimpleTrackEventAction
}

export class SimpleTrackPlayer {
	private _audioContext: AudioContext
	private _intervalId: number
	private _index: number = 0
	private _dispatch: Dispatch
	private _events: SimpleTrackEvent[]
	private _startTime: number
	private _inTick: boolean = false

	constructor(dispatch: Dispatch, audioContext: AudioContext) {
		this._dispatch = dispatch
		this._audioContext = audioContext
	}

	public play = (events: SimpleTrackEvent[]) => {
		logger.log('play')
		this._events = events
		this._startTime = this._audioContext.currentTime
		this._intervalId = window.setInterval(this._onTick, 100)
	}

	public stop = () => {
		clearInterval(this._intervalId)
		this._index = 0
		this._stopNote()
		this._dispatch(setSimpleTrackIndex(-1))
	}

	public getCurrentPlayTime() {
		return this._audioContext.currentTime - this._startTime
	}

	private _onTick = () => {
		logger.debug('tick')
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

		if (nextEvent.time <= currentPlayTime) {
			if (nextEvent.action === SimpleTrackEventAction.endTrack) {
				this._index = 0
				this._startTime = this._audioContext.currentTime
			} else {
				this._doEvent(nextEvent)
				this._index++
				this._dispatch(setSimpleTrackIndex(this._index - 1))
			}
		}
	}

	private _doEvent(event: SimpleTrackEvent) {
		logger.log('_doEvent, event: ', event)
		switch (event.action) {
			case SimpleTrackEventAction.playNote: return this._playNote()
			case SimpleTrackEventAction.stopNote: return this._stopNote()
			default: return logger.warn('unknown event note action')
		}
	}

	private _playNote() {
		this._dispatch(virtualKeyPressed('track-1', 0))
	}

	private _stopNote() {
		this._dispatch(virtualKeyUp('track-1', 0))
	}
}
