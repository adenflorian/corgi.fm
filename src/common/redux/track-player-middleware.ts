import {saveAs} from 'file-saver'
import * as MidiWriter from 'midi-writer-js'
import {AnyAction, Dispatch, Middleware, MiddlewareAPI} from 'redux'
import {midiNoteToNoteName} from '../../client/music/music-functions'
import {TrackPlayer} from '../../client/TrackPlayer'
import {IClientAppState} from './common-redux-types'
import {addComplexObject, selectComplexObjectById} from './complex-objects-redux'
import {BROADCASTER_ACTION, SERVER_ACTION} from './redux-utils'
import {
	EXPORT_TRACK_MIDI, ExportTrackMidiAction, ITracks, selectTrack, selectTrackEvents, setTrackIndex, UPDATE_TRACKS,
} from './tracks-redux'

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

export const RESTART_TRACK = 'RESTART_TRACK'
export const restartTrack = (id: string) => ({
	type: RESTART_TRACK,
	id,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const createTrackPlayerMiddleware = (audioContext: AudioContext) => {

	const trackPlayerMiddleware: Middleware<{}, IClientAppState> = store => next => action => {
		switch (action.type) {
			case PLAY_TRACK:
			case STOP_TRACK:
			case RESTART_TRACK:
			case UPDATE_TRACKS:
				let trackPlayer = selectComplexObjectById(store.getState(), action.id)

				if (trackPlayer === undefined) {
					trackPlayer = new TrackPlayer(
						audioContext,
						index => store.dispatch(setTrackIndex(action.id, index)),
					)
					store.dispatch(
						addComplexObject(action.id, trackPlayer),
					)
				}

				return handleAction(action, trackPlayer, next, store)
			case EXPORT_TRACK_MIDI:
				return exportTrackMidi(action, next, store)
			default:
				return next(action)
		}
	}

	return trackPlayerMiddleware
}

function handleAction(
	action: AnyAction, trackPlayer: TrackPlayer, next: Dispatch, store: MiddlewareAPI<Dispatch, IClientAppState>,
) {
	switch (action.type) {
		case PLAY_TRACK:
			trackPlayer.play(selectTrack(store.getState().room, action.id).events.length)
			return next(action)
		case STOP_TRACK:
			trackPlayer.stop()
			return next(action)
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

function exportTrackMidi(
	action: ExportTrackMidiAction, next: Dispatch, store: MiddlewareAPI<Dispatch, IClientAppState>,
) {
	const roomState = store.getState().room

	const events = selectTrackEvents(roomState, action.trackId)

	const midiTrack = new MidiWriter.Track()

	const duration = '8'

	let nextWait = '0'

	const eventsToMidi = events.map(event => {
		const x = new MidiWriter.NoteEvent({
			pitch: event.notes,
			duration,
			wait: nextWait,
		})

		nextWait = event.notes.length === 0 ? duration : '0'

		return x
	})

	midiTrack.setTempo(120)

	midiTrack.addEvent(
		eventsToMidi,
		// () => ({sequential: true}),
	)

	const write = new MidiWriter.Writer([midiTrack])

	saveAs(write.dataUri(), selectTrack(roomState, action.trackId).name + '.mid')

	return next(action)
}
