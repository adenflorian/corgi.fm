import {Map, Record, Set} from 'immutable'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {
	BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION,
} from '..'
import {selectExpProjectState} from '.'

export const expMidiTimelineTracksActions = {
	add: (newTrack: ExpMidiTimelineTrackState) => ({
		type: 'EXP_MIDI_TIMELINE_TRACK_ADD' as const,
		isExpMidiTimelineTrackAction: true,
		newTrack,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	delete: (id: Id) => ({
		type: 'EXP_MIDI_TIMELINE_TRACK_DELETE' as const,
		isExpMidiTimelineTrackAction: true,
		id,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	update: (updatedTrack: ExpMidiTimelineTrackState) => ({
		type: 'EXP_MIDI_TIMELINE_TRACK_UPDATE' as const,
		isExpMidiTimelineTrackAction: true,
		updatedTrack,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	addClip: (trackId: Id, newClip: Id) => ({
		type: 'EXP_MIDI_TIMELINE_TRACK_ADD_CLIP' as const,
		isExpMidiTimelineTrackAction: true,
		trackId,
		newClip,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	removeClip: (trackId: Id, clipToRemove: Id) => ({
		type: 'EXP_MIDI_TIMELINE_TRACK_REMOVE_CLIP' as const,
		isExpMidiTimelineTrackAction: true,
		trackId,
		clipToRemove,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
} as const

export type ExpMidiTimelineTracksAction = ActionType<typeof expMidiTimelineTracksActions>

const defaultExpMidiTimelineTrackState = {
	id: 'dummyId' as Id,
	name: 'dummyName' as string,
	active: true as false,
	solo: false as boolean,
	armed: false as boolean,
	loopStartBeat: 0 as number,
	loopEndBeat: 4 as number,
	timelineClipIds: Set<Id>(),
} as const

const _makeExpMidiTimelineTrackState = Record(defaultExpMidiTimelineTrackState)

export const defaultExpMidiTimelineTrackRecord: ExpMidiTimelineTrackState = _makeExpMidiTimelineTrackState()

export function makeExpMidiTimelineTrackState(
	track: Partial<typeof defaultExpMidiTimelineTrackState>,
): ExpMidiTimelineTrackState {
	return _makeExpMidiTimelineTrackState(track)
		.set('id', track.id || uuid.v4())
		.set('timelineClipIds', Set(track.timelineClipIds || []))
}

export interface ExpMidiTimelineTrackState extends ReturnType<typeof _makeExpMidiTimelineTrackState> {}

export type ExpMidiTimelineTrackStateRaw = typeof defaultExpMidiTimelineTrackState

const initialState = Map<Id, ExpMidiTimelineTrackState>()

export type ExpMidiTimelineTracksState = typeof initialState

export const expMidiTimelineTracksReducer =
	(state = initialState, action: ExpMidiTimelineTracksAction): ExpMidiTimelineTracksState => {
		switch (action.type) {
			case 'EXP_MIDI_TIMELINE_TRACK_ADD':
				return state.set(action.newTrack.id, makeExpMidiTimelineTrackState(action.newTrack))
			case 'EXP_MIDI_TIMELINE_TRACK_UPDATE':
				return state.update(action.updatedTrack.id, x => x.merge(action.updatedTrack))
			case 'EXP_MIDI_TIMELINE_TRACK_ADD_CLIP':
				return state.update(action.trackId, x => x.update('timelineClipIds', y => y.add(action.newClip)))
			case 'EXP_MIDI_TIMELINE_TRACK_REMOVE_CLIP':
				return state.update(action.trackId, x => x.update('timelineClipIds', y => y.delete(action.clipToRemove)))
			case 'EXP_MIDI_TIMELINE_TRACK_DELETE':
				return state.delete(action.id)
			default: return state
		}
	}

export const selectExpMidiTimelineTracksState = (state: IClientRoomState): ExpMidiTimelineTracksState =>
	selectExpProjectState(state).state.midi.timelineTracks

export const selectExpMidiTimelineTrack = (state: IClientRoomState, id: Id): ExpMidiTimelineTrackState =>
	selectExpMidiTimelineTracksState(state).get(id) || defaultExpMidiTimelineTrackRecord
