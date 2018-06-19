import {ISimpleTrackEvent, SimpleTrackEventAction, SimpleTrackPlayer} from '../../client/SimpleTrackPlayer'
import {IAppState} from './configureStore'
import {makeActionCreator} from './redux-utils'
import {ISimpleTrackNote, selectSimpleTrackNotes} from './simple-track-redux'

export const PLAY_SIMPLE_TRACK = 'PLAY_SIMPLE_TRACK'
export const playSimpleTrack = makeActionCreator(PLAY_SIMPLE_TRACK)

export const STOP_SIMPLE_TRACK = 'STOP_SIMPLE_TRACK'
export const stopSimpleTrack = makeActionCreator(STOP_SIMPLE_TRACK)

export const RESTART_SIMPLE_TRACK = 'RESTART_SIMPLE_TRACK'
export const restartSimpleTrack = makeActionCreator(RESTART_SIMPLE_TRACK)

export const REFRESH_SIMPLE_TRACK_PLAYER_EVENTS = 'REFRESH_SIMPLE_TRACK_PLAYER_EVENTS'
export const refreshSimpleTrackPlayerEvents = makeActionCreator(REFRESH_SIMPLE_TRACK_PLAYER_EVENTS)

let simpleTrackPlayer: SimpleTrackPlayer

export const trackPlayerMiddleware = store => next => action => {
	let state: IAppState = store.getState()

	switch (action.type) {
		case PLAY_SIMPLE_TRACK:
			if (simpleTrackPlayer === undefined) {
				simpleTrackPlayer = new SimpleTrackPlayer(store.dispatch, state.audio.context)
			}
			simpleTrackPlayer.play(notesToEvents(selectSimpleTrackNotes(state)))
			return next(action)
		case STOP_SIMPLE_TRACK:
			if (simpleTrackPlayer === undefined) {
				simpleTrackPlayer = new SimpleTrackPlayer(store.dispatch, state.audio.context)
			}
			simpleTrackPlayer.stop()
			return next(action)
		case RESTART_SIMPLE_TRACK:
			if (simpleTrackPlayer === undefined) {
				simpleTrackPlayer = new SimpleTrackPlayer(store.dispatch, state.audio.context)
			}
			if (simpleTrackPlayer.isPlaying()) {
				simpleTrackPlayer.stop()
				simpleTrackPlayer.play(notesToEvents(selectSimpleTrackNotes(state)))
			}
			return next(action)
		case REFRESH_SIMPLE_TRACK_PLAYER_EVENTS:
			next(action)
			state = store.getState()
			if (simpleTrackPlayer === undefined) {
				simpleTrackPlayer = new SimpleTrackPlayer(store.dispatch, state.audio.context)
			}
			simpleTrackPlayer.setEvents(notesToEvents(selectSimpleTrackNotes(state)))
			return next(action)
		default:
			return next(action)
	}
}

function notesToEvents(events: ISimpleTrackNote[]): ISimpleTrackEvent[] {
	const newEvents = events.reduce((foo, event, index) => {
		foo.push({
			time: index / 5,
			action: SimpleTrackEventAction.playNote,
			notes: event.notes,
		})
		foo.push({
			time: (index / 5) + (1 / 5),
			action: SimpleTrackEventAction.stopNote,
			notes: event.notes,
		})
		return foo
	}, []).concat({time: events.length / 5, action: SimpleTrackEventAction.endTrack, notes: []})

	return newEvents
}
