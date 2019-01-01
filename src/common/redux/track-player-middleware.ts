import {AnyAction, Dispatch, Middleware, MiddlewareAPI} from 'redux'
import {TrackPlayer} from '../../client/TrackPlayer'
import {IClientAppState} from './common-redux-types'
import {BROADCASTER_ACTION, SERVER_ACTION} from './redux-utils'
import {ITracks, selectTrack, setTrackIndex, UPDATE_TRACKS} from './tracks-redux'

export const PLAY_TRACK = 'PLAY_TRACK'
export const playTrack = (id: string) => ({
	type: PLAY_TRACK,
	id,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const STOP_TRACK = 'STOP_TRACK'
export const stopTrack = (id: string) => ({
	type: STOP_TRACK,
	id,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const TOGGLE_PLAY_TRACK = 'TOGGLE_PLAY_TRACK'
export const togglePlayTrack = (id: string) => ({
	type: TOGGLE_PLAY_TRACK,
	id,
})

export const RESTART_TRACK = 'RESTART_TRACK'
export const restartTrack = (id: string) => ({
	type: RESTART_TRACK,
	id,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

interface ITrackPlayers {
	[trackId: string]: TrackPlayer
}

const trackPlayers: ITrackPlayers = {}

export const createTrackPlayerMiddleware = (audioContext: AudioContext) => {

	const trackPlayerMiddleware: Middleware<{}, IClientAppState> = store => next => action => {
		switch (action.type) {
			case PLAY_TRACK:
			case STOP_TRACK:
			case TOGGLE_PLAY_TRACK:
			case RESTART_TRACK:
			case UPDATE_TRACKS:
				let trackPlayer = trackPlayers[action.id]
				if (trackPlayer === undefined) {
					trackPlayers[action.id] = new TrackPlayer(
						audioContext,
						index => store.dispatch(setTrackIndex(action.id, index)),
					)
					trackPlayer = trackPlayers[action.id]
				}
				return foo(action, trackPlayer, next, store)
			default:
				return next(action)
		}
	}

	return trackPlayerMiddleware
}

function foo(
	action: AnyAction, trackPlayer: TrackPlayer, next: Dispatch, store: MiddlewareAPI<Dispatch, IClientAppState>,
) {
	switch (action.type) {
		case PLAY_TRACK:
			trackPlayer.play(selectTrack(store.getState().room, action.id).events.length)
			return next(action)
		case STOP_TRACK:
			trackPlayer.stop()
			return next(action)
		// case TOGGLE_PLAY_TRACK:
		// 	if (trackPlayer.isPlaying()) {
		// 		trackPlayer.stop()
		// 		next(stopTrack())
		// 	} else {
		// 		trackPlayer.play(selectTrack(store.getState(), action.id).notes.length)
		// 		next(playTrack())
		// 	}
		// 	return next(action)
		case RESTART_TRACK:
			if (trackPlayer.isPlaying()) {
				trackPlayer.stop()
				trackPlayer.play(selectTrack(store.getState().room, action.id).events.length)
			}
			return next(action)
		case UPDATE_TRACKS:
			next(action)
			const tracks: ITracks = action.tracks
			Object.keys(tracks).forEach(trackId => {
				const track = tracks[trackId]
				if (track.isPlaying) {
					store.dispatch(playTrack(track.id))
				}
			})
			return
		// case REFRESH_TRACK_PLAYER_EVENTS:
		// 	next(action)
		// 	trackPlayer.setEvents(selectTrack(store.getState(), action.id).notes.length)
		// 	return
		default:
			throw new Error('invalid track player action type')
	}
}

// function notesToEvents(events: ITrackEvent[]): ISimpleTrackEvent[] {
// 	return events.reduce((newEvents, event, index) => {
// 		newEvents.push({
// 			time: index / 5,
// 			action: SimpleTrackEventAction.playNote,
// 			notes: event.notes,
// 		})
// 		newEvents.push({
// 			time: (index / 5) + (1 / 5),
// 			action: SimpleTrackEventAction.stopNote,
// 			notes: event.notes,
// 		})
// 		return newEvents
// 	}, []).concat({time: events.length / 5, action: SimpleTrackEventAction.endTrack, notes: []})
// }
