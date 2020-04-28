import {Map, Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {
	BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION,
} from '..'
import {selectExpProjectState} from '.'
import {SeqTimelineClip} from '../../SeqStuff'

export const expMidiTimelineClipsActions = {
	add: (newClip: ExpMidiTimelineClipState) => ({
		type: 'EXP_MIDI_TIMELINE_CLIP_ADD' as const,
		isExpMidiTimelineClipAction: true,
		newClip,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	delete: (id: Id) => ({
		type: 'EXP_MIDI_TIMELINE_CLIP_DELETE' as const,
		isExpMidiTimelineClipAction: true,
		id,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	update: (updatedClip: ExpMidiTimelineClipState) => ({
		type: 'EXP_MIDI_TIMELINE_CLIP_UPDATE' as const,
		isExpMidiTimelineClipAction: true,
		updatedClip,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	updateMany: (updatedClips: ExpMidiTimelineClipsState) => ({
		type: 'EXP_MIDI_TIMELINE_CLIP_UPDATE_CLIPS' as const,
		isExpMidiTimelineClipAction: true,
		updatedClips,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
} as const

export type ExpMidiTimelineClipsAction = ActionType<typeof expMidiTimelineClipsActions>

const defaultExpMidiTimelineClipState = {
	id: 'dummyId' as Id,
	name: 'dummyName' as string,
	active: true as boolean,
	startBeat: 0 as number,
	beatLength: 4 as number,
	patternView: 'dummyPatternViewId' as Id,
} as const

const _makeExpMidiTimelineClipState = Record(defaultExpMidiTimelineClipState)

export const defaultExpMidiTimelineClipRecord: ExpMidiTimelineClipState = _makeExpMidiTimelineClipState()

export function makeExpMidiTimelineClipState(
	clip: Partial<typeof defaultExpMidiTimelineClipState>,
): ExpMidiTimelineClipState {
	return _makeExpMidiTimelineClipState(clip)
		.set('id', clip.id || uuid.v4())
}

export function seqTimelineClipToState(clip: SeqTimelineClip): ExpMidiTimelineClipState {
	return makeExpMidiTimelineClipState({
		...clip,
		patternView: clip.patternView.id,
	})
}

export interface ExpMidiTimelineClipState extends ReturnType<typeof _makeExpMidiTimelineClipState> {}

export type ExpMidiTimelineClipStateRaw = typeof defaultExpMidiTimelineClipState

const initialState = Map<Id, ExpMidiTimelineClipState>()

export type ExpMidiTimelineClipsState = typeof initialState

export const expMidiTimelineClipsReducer =
	(state = initialState, action: ExpMidiTimelineClipsAction): ExpMidiTimelineClipsState => {
		switch (action.type) {
			case 'EXP_MIDI_TIMELINE_CLIP_ADD':
				return state.set(action.newClip.id, makeExpMidiTimelineClipState(action.newClip))
			case 'EXP_MIDI_TIMELINE_CLIP_UPDATE':
				return state.update(action.updatedClip.id, x => x.merge(action.updatedClip))
			case 'EXP_MIDI_TIMELINE_CLIP_UPDATE_CLIPS':
				return state.merge(Map(action.updatedClips).map(makeExpMidiTimelineClipState))
			case 'EXP_MIDI_TIMELINE_CLIP_DELETE':
				return state.delete(action.id)
			default: return state
		}
	}

export const selectExpMidiTimelineClipsState = (state: IClientRoomState): ExpMidiTimelineClipsState =>
	selectExpProjectState(state).state.midi.timelineClips

export const selectExpMidiTimelineClip = (state: IClientRoomState, id: Id): ExpMidiTimelineClipState =>
	selectExpMidiTimelineClipsState(state).get(id) || defaultExpMidiTimelineClipRecord
