import {audioContext} from '../../client/setup-audio-context'
import {ISimpleTrackEvent, SimpleTrackEventAction, SimpleTrackPlayer} from '../../client/SimpleTrackPlayer'
import {IAppState} from './configureStore'
import {makeActionCreator, makeBroadcaster, makeServerAction} from './redux-utils'
import {ISimpleTrackNote, selectSimpleTrackEvents} from './simple-track-redux'

export const PLAY_SIMPLE_TRACK = 'PLAY_SIMPLE_TRACK'
export const playSimpleTrack = makeServerAction(makeBroadcaster(makeActionCreator(PLAY_SIMPLE_TRACK)))

export const STOP_SIMPLE_TRACK = 'STOP_SIMPLE_TRACK'
export const stopSimpleTrack = makeServerAction(makeBroadcaster(makeActionCreator(STOP_SIMPLE_TRACK)))

export const TOGGLE_PLAY_SIMPLE_TRACK = 'TOGGLE_PLAY_SIMPLE_TRACK'
export const togglePlaySimpleTrack = makeActionCreator(TOGGLE_PLAY_SIMPLE_TRACK)

export const RESTART_SIMPLE_TRACK = 'RESTART_SIMPLE_TRACK'
export const restartSimpleTrack = makeBroadcaster(makeActionCreator(RESTART_SIMPLE_TRACK))

export const REFRESH_SIMPLE_TRACK_PLAYER_EVENTS = 'REFRESH_SIMPLE_TRACK_PLAYER_EVENTS'
export const refreshSimpleTrackPlayerEvents = makeBroadcaster(makeActionCreator(REFRESH_SIMPLE_TRACK_PLAYER_EVENTS))

let simpleTrackPlayer: SimpleTrackPlayer

export const trackPlayerMiddleware = store => next => action => {
	let state: IAppState = store.getState()

	if (simpleTrackPlayer === undefined) {
		simpleTrackPlayer = new SimpleTrackPlayer(store.dispatch, audioContext)
	}

	switch (action.type) {
		case PLAY_SIMPLE_TRACK:
			simpleTrackPlayer.play(notesToEvents(selectSimpleTrackEvents(state)))
			return next(action)
		case STOP_SIMPLE_TRACK:
			simpleTrackPlayer.stop()
			return next(action)
		case TOGGLE_PLAY_SIMPLE_TRACK:
			if (simpleTrackPlayer.isPlaying()) {
				simpleTrackPlayer.stop()
				next(stopSimpleTrack())
			} else {
				simpleTrackPlayer.play(notesToEvents(selectSimpleTrackEvents(state)))
				next(playSimpleTrack())
			}
			return next(action)
		case RESTART_SIMPLE_TRACK:
			if (simpleTrackPlayer.isPlaying()) {
				simpleTrackPlayer.stop()
				simpleTrackPlayer.play(notesToEvents(selectSimpleTrackEvents(state)))
			}
			return next(action)
		case REFRESH_SIMPLE_TRACK_PLAYER_EVENTS:
			next(action)
			state = store.getState()
			simpleTrackPlayer.setEvents(notesToEvents(selectSimpleTrackEvents(state)))
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
