import {Map, Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {
	BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION,
} from '..'
import {selectExpProjectState} from '.'

export const expMidiPatternViewsActions = {
	add: (newPattern: ExpMidiPatternViewState) => ({
		type: 'EXP_MIDI_PATTERN_VIEW_ADD' as const,
		isExpMidiPatternViewAction: true,
		newPattern,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	delete: (id: Id) => ({
		type: 'EXP_MIDI_PATTERN_VIEW_DELETE' as const,
		isExpMidiPatternViewAction: true,
		id,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	update: (updatedPattern: ExpMidiPatternViewState) => ({
		type: 'EXP_MIDI_PATTERN_VIEW_UPDATE' as const,
		isExpMidiPatternViewAction: true,
		updatedPattern,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
} as const

export type ExpMidiPatternViewsAction = ActionType<typeof expMidiPatternViewsActions>

const defaultExpMidiPatternViewState = {
	id: 'dummyId' as Id,
	name: 'dummyName' as string,
	startBeat: 0 as number,
	endBeat: 4 as number,
	loopStartBeat: 0 as number,
	loopEndBeat: 4 as number,
	pattern: 'dummyPatternId' as Id,
} as const

const _makeExpMidiPatternViewState = Record(defaultExpMidiPatternViewState)

export const defaultExpMidiPatternViewRecord: ExpMidiPatternViewState = _makeExpMidiPatternViewState()

export function makeExpMidiPatternViewState(
	pattern: Partial<typeof defaultExpMidiPatternViewState>,
): ExpMidiPatternViewState {
	return _makeExpMidiPatternViewState(pattern)
		.set('id', pattern.id || uuid.v4())
}

export interface ExpMidiPatternViewState extends ReturnType<typeof _makeExpMidiPatternViewState> {}

export type ExpMidiPatternViewStateRaw = typeof defaultExpMidiPatternViewState

const initialState = Map<Id, ExpMidiPatternViewState>()

export type ExpMidiPatternViewsState = typeof initialState

export const expMidiPatternViewsReducer =
	(state = initialState, action: ExpMidiPatternViewsAction): ExpMidiPatternViewsState => {
		switch (action.type) {
			case 'EXP_MIDI_PATTERN_VIEW_ADD':
				return state.set(action.newPattern.id, makeExpMidiPatternViewState(action.newPattern))
			case 'EXP_MIDI_PATTERN_VIEW_UPDATE':
				return state.update(action.updatedPattern.id, x => x.merge(action.updatedPattern))
			case 'EXP_MIDI_PATTERN_VIEW_DELETE':
				return state.delete(action.id)
			default: return state
		}
	}

export const selectExpMidiPatternViewsState = (state: IClientRoomState): ExpMidiPatternViewsState =>
	selectExpProjectState(state).state.midi.patternViews

export const selectExpMidiPatternView = (state: IClientRoomState, id: Id): ExpMidiPatternViewState =>
	selectExpMidiPatternViewsState(state).get(id) || defaultExpMidiPatternViewRecord
