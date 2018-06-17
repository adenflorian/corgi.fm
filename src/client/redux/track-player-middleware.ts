import {SimpleTrackEventAction, SimpleTrackPlayer} from '../SimpleTrackPlayer'
import {IAppState} from './configureStore'
import {makeActionCreator} from './redux-utils'

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
					action: SimpleTrackEventAction.playNote,
				},
				{
					time: 1,
					action: SimpleTrackEventAction.stopNote,
				},
				{
					time: 2,
					action: SimpleTrackEventAction.endTrack,
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
