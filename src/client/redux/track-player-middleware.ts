import {SimpleTrackEventAction, SimpleTrackPlayer} from '../SimpleTrackPlayer'
import {IAppState} from './configureStore'
import {makeActionCreator} from './redux-utils'
import {selectSimpleTrackNotes} from './simple-track-redux'

export const PLAY_SIMPLE_TRACK = 'PLAY_SIMPLE_TRACK'
export const playSimpleTrack = makeActionCreator(PLAY_SIMPLE_TRACK)

export const STOP_SIMPLE_TRACK = 'STOP_SIMPLE_TRACK'
export const stopSimpleTrack = makeActionCreator(STOP_SIMPLE_TRACK)

let simpleTrackPlayer: SimpleTrackPlayer

export const trackPlayerMiddleware = store => next => action => {
	const state: IAppState = store.getState()

	switch (action.type) {
		case PLAY_SIMPLE_TRACK:
			if (simpleTrackPlayer === undefined) {
				simpleTrackPlayer = new SimpleTrackPlayer(store.dispatch, state.audio.context)
			}
			const notes = selectSimpleTrackNotes(state)
			simpleTrackPlayer.play(notesToEvents(notes))
			return next(action)
		case STOP_SIMPLE_TRACK:
			if (simpleTrackPlayer === undefined) {
				simpleTrackPlayer = new SimpleTrackPlayer(store.dispatch, state.audio.context)
			}
			simpleTrackPlayer.stop()
			return next(action)
		default:
			return next(action)
	}
}

function notesToEvents(notes: boolean[]) {
	return notes.map((note, index) => {
		return {
			time: index / 10,
			action: note ? SimpleTrackEventAction.playNote : SimpleTrackEventAction.stopNote,
		}
	}).concat({time: notes.length / 10, action: SimpleTrackEventAction.endTrack})
}
