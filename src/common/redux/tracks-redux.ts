import * as Color from 'color'
import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {hashbow} from '../../client/utils'
import {IMidiNote} from '../MidiNote'
import {addIfNew} from '../server-common'
import {MAX_MIDI_NOTE_NUMBER_127} from '../server-constants'
import {IClientAppState} from './client-store'
import {
	addMultiThing, deleteThings, IMultiStateThings, makeMultiReducer, MultiThingType, updateThings,
} from './multi-reducer'
import {BROADCASTER_ACTION, SERVER_ACTION} from './redux-utils'
import {PLAY_TRACK, STOP_TRACK} from './track-player-middleware'

export const ADD_TRACK = 'ADD_TRACK'
export const addTrack = (track: ITrackState) => ({
	...addMultiThing(track, MultiThingType.track),
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const DELETE_TRACKS = 'DELETE_TRACKS'
export const deleteTracks = (trackIds: string[]) => ({
	...deleteThings(trackIds, MultiThingType.track),
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const UPDATE_TRACKS = 'UPDATE_TRACKS'
export const updateTracks = (tracks: ITracks) => ({
	...updateThings(tracks, MultiThingType.track),
	BROADCASTER_ACTION,
})

export const SET_TRACK_NOTE = 'SET_TRACK_NOTE'
export const setTrackNote =
	(trackId: string, index: number, enabled: boolean, note: IMidiNote) => {
		return {
			type: SET_TRACK_NOTE,
			id: trackId,
			index,
			enabled,
			note,
			SERVER_ACTION,
			BROADCASTER_ACTION,
		}
	}

export const SET_TRACK_EVENTS = 'SET_TRACK_EVENTS'
export const setTrackEvents = (trackId: string, events: ITrackEvent[]) => {
	return {
		type: SET_TRACK_EVENTS,
		id: trackId,
		events,
	}
}

export const SET_TRACK_INDEX = 'SET_TRACK_INDEX'
export const setTrackIndex = (id: string, index: number) => {
	return {
		type: SET_TRACK_INDEX,
		id,
		index,
	}
}

export const SET_TRACK_BOTTOM_NOTE = 'SET_TRACK_BOTTOM_NOTE'
export const setTrackBottomNote = (id: string, bottomNote: number) => {
	return {
		type: SET_TRACK_BOTTOM_NOTE,
		id,
		bottomNote,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}
}

export interface ITrackEvent {
	notes: IMidiNote[]
}

export interface ITracksState {
	things: ITracks
}

export interface ITracks extends IMultiStateThings {
	[key: string]: ITrackState
}

export interface ITrackState {
	events: ITrackEvent[]
	index: number
	isPlaying: boolean
	id: string
	color: string
	name: string
	bottomNote: number
	notesToShow: number
}

export class TrackState implements ITrackState {
	public readonly id: string = uuid.v4()
	public readonly events: ITrackEvent[]
	public readonly index: number = -1
	public readonly isPlaying: boolean = false
	public readonly color: string
	public name: string
	public bottomNote: number = 0
	public notesToShow = 36

	constructor(events?: ITrackEvent[]) {
		this.color = Color(hashbow(this.id)).desaturate(0.2).hsl().string()
		this.events = events || [
			{notes: []},
			{notes: []},
			{notes: []},
			{notes: []},
			{notes: []},
			{notes: []},
			{notes: []},
			{notes: []},
		]
		const lowestNote = findLowestNote(this.events)
		this.bottomNote = Math.min(MAX_MIDI_NOTE_NUMBER_127 - this.notesToShow, lowestNote)
	}
}

function findLowestNote(events: ITrackEvent[]): number {
	let lowest = Number.MAX_VALUE

	events.forEach(event => {
		event.notes.forEach(note => {
			if (note < lowest) {
				lowest = note
			}
		})
	})

	if (lowest === Number.MAX_VALUE) {
		return 0
	}

	return lowest
}

export interface ITrackEvent {
	notes: IMidiNote[]
}

export const trackActionTypes = [
	SET_TRACK_NOTE,
	SET_TRACK_EVENTS,
	SET_TRACK_INDEX,
	PLAY_TRACK,
	STOP_TRACK,
	SET_TRACK_BOTTOM_NOTE,
]

export const tracksReducer = makeMultiReducer(trackReducer, MultiThingType.track, trackActionTypes)

export function trackReducer(track: ITrackState, action: AnyAction) {
	switch (action.type) {
		case SET_TRACK_NOTE:
			if (action.note === undefined) {
				throw new Error('action.notes === undefined')
			}
			return {
				...track,
				events: track.events.map((event, eventIndex) => {
					if (eventIndex === action.index) {
						if (action.enabled) {
							return {
								...event,
								notes: addIfNew(event.notes, action.note),
							}
						} else {
							return {
								...event,
								notes: event.notes.filter(x => x !== action.note),
							}
						}
					} else {
						return event
					}
				}),
			}
		case SET_TRACK_EVENTS:
			return {
				...track,
				notes: action.events,
			}
		case SET_TRACK_INDEX:
			return {...track, index: action.index}
		case PLAY_TRACK:
			return {...track, isPlaying: true}
		case STOP_TRACK:
			return {...track, isPlaying: false}
		case SET_TRACK_BOTTOM_NOTE:
			return {...track, bottomNote: action.bottomNote}
		default:
			throw new Error('invalid action type')
	}
}

export const selectAllTracks = (state: IClientAppState) => state.tracks.things

export const selectAllTracksArray = (state: IClientAppState) => {
	const tracks = selectAllTracks(state)
	return Object.keys(tracks).map(x => tracks[x])
}

export const selectAllTrackIds = (state: IClientAppState) => {
	return Object.keys(selectAllTracks(state))
}

export const selectTrack = (state: IClientAppState, id: string) =>
	selectAllTracks(state)[id]

export const selectTrackEvents = (state: IClientAppState, id: string) =>
	selectTrack(state, id).events

export const selectTrackEvent = (state: IClientAppState, id: string, eventIndex: number) =>
	selectTrackEvents(state, id)[eventIndex]

export const selectTrackEventNotes = (state: IClientAppState, id: string, eventIndex: number) =>
	selectTrackEvent(state, id, eventIndex).notes
