import {Dispatch} from 'redux'
import {logger} from '../logger'
import {IAppState} from './configureStore'
import {makeActionCreator} from './redux-utils'
import {selectSimpleTrackNotes} from './simple-track-redux'
import {virtualKeyPressed, virtualKeyUp} from './virtual-keyboard-redux'

export const PLAY_SIMPLE_TRACK = 'PLAY_SIMPLE_TRACK'
export const playSimpleTrack = makeActionCreator(PLAY_SIMPLE_TRACK)

export const STOP_SIMPLE_TRACK = 'STOP_SIMPLE_TRACK'
export const stopSimpleTrack = makeActionCreator(STOP_SIMPLE_TRACK)

let simpleTrackPlayer

export const trackPlayerMiddleware = store => next => action => {
	const state: IAppState = store.getState()

	// const notes = selectSimpleTrackNotes(state)

	switch (action.type) {
		case PLAY_SIMPLE_TRACK:
			if (simpleTrackPlayer === undefined) {
				simpleTrackPlayer = new SimpleTrackPlayer(store.dispatch, state.audio.context)
			}
			simpleTrackPlayer.play([
				{
					time: 0,
					noteAction: SimpleTrackEventNoteAction.play,
				},
				{
					time: 1,
					noteAction: SimpleTrackEventNoteAction.stop,
				},
				{
					time: 2,
					noteAction: SimpleTrackEventNoteAction.stop,
				},
			])
			break
		case STOP_SIMPLE_TRACK:
			if (simpleTrackPlayer === undefined) {
				simpleTrackPlayer = new SimpleTrackPlayer(store.dispatch, state.audio.context)
			}
			simpleTrackPlayer.stop()
		default:
			return next(action)
	}
}

enum SimpleTrackEventNoteAction {
	play,
	stop,
}

interface SimpleTrackEvent {
	time: number
	noteAction: SimpleTrackEventNoteAction
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
		logger.log('playyyy')
		this._events = events
		this._startTime = this._audioContext.currentTime
		this._intervalId = window.setInterval(this._onTick, 1000)
	}

	public stop = () => {
		clearInterval(this._intervalId)
		this._index = 0
		this._stopNote()
	}

	public getCurrentPlayTime() {
		return this._audioContext.currentTime - this._startTime
	}

	private _onTick = () => {
		logger.log('tick')
		if (this._inTick === false) {
			this._inTick = true
			this._doTick()
			this._inTick = false
		}
	}

	private _doTick() {
		const nextEvent = this._events[this._index]
		const currentPlayTime = this.getCurrentPlayTime()
		logger.log('_doTick, currentPlayTime: ', currentPlayTime)
		logger.log('_doTick, nextEvent: ', nextEvent)

		if (nextEvent.time <= currentPlayTime) {
			this._doEvent(nextEvent)
			if (this._index >= this._events.length - 1) {
				this._index = 0
			} else {
				this._index++
			}
		}
	}

	private _doEvent(event: SimpleTrackEvent) {
		logger.log('_doEvent, event: ', event)
		switch (event.noteAction) {
			case SimpleTrackEventNoteAction.play:
				this._playNote()
				break
			case SimpleTrackEventNoteAction.stop:
				this._stopNote()
				break
			default:
				logger.warn('unknown event note action')
				break
		}
	}

	private _playNote() {
		this._dispatch(virtualKeyPressed('track-1', 0))
	}

	private _stopNote() {
		this._dispatch(virtualKeyUp('track-1', 0))
	}
}
