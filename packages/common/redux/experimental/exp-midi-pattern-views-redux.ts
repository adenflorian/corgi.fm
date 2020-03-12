import {Map, Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {
	BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION,
} from '..'
import {selectExpProjectState} from '.'

export const expMidiPatternViewsActions = {
	add: (newPattern: ExpMidiPatternViewState) => ({
		type: 'EXP_MIDI_PATTERN_ADD' as const,
		isExpMidiPatternViewAction: true,
		newPattern,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	addMany: (newPatterns: Map<Id, ExpMidiPatternViewState>) => ({
		type: 'EXP_MIDI_PATTERN_ADD_MANY' as const,
		isExpMidiPatternViewAction: true,
		newPatterns,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	delete: (nodeId: Id) => ({
		type: 'EXP_MIDI_PATTERN_DELETE' as const,
		isExpMidiPatternViewAction: true,
		nodeId,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	deleteMany: (nodeIds: readonly Id[]) => ({
		type: 'EXP_MIDI_PATTERN_DELETE_MANY' as const,
		isExpMidiPatternViewAction: true,
		nodeIds,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	replaceAll: (state: ExpMidiPatternViewsState) => ({
		type: 'EXP_MIDI_PATTERN_REPLACE_ALL' as const,
		isExpMidiPatternViewAction: true,
		state,
	} as const),
} as const

export type ExpMidiPatternViewsAction = ActionType<typeof expMidiPatternViewsActions>

const defaultExpMidiPatternViewState = {
	id: 'dummyId' as Id,
	name: 'dummyName',
	startBeat: 0,
	endBeat: 4,
	loopStartBeat: 0,
	loopEndBeat: 4,
	pattern: 'dummyPatternId' as Id,
}

const _makeExpMidiPatternViewState = Record(defaultExpMidiPatternViewState)

export const defaultExpMidiPatternViewRecord: ExpMidiPatternViewState = _makeExpMidiPatternViewState()

export function makeExpMidiPatternViewState(
	pattern: Partial<typeof defaultExpMidiPatternViewState>,
): ExpMidiPatternViewState {
	return _makeExpMidiPatternViewState(pattern)
		.set('id', pattern.id || uuid.v4())
}

export interface ExpMidiPatternViewState extends ReturnType<typeof _makeExpMidiPatternViewState> {}

const initialState = Map<Id, ExpMidiPatternViewState>()

export type ExpMidiPatternViewsState = typeof initialState

export const expMidiPatternViewsReducer =
	(state = initialState, action: ExpMidiPatternViewsAction): ExpMidiPatternViewsState => {
		switch (action.type) {
			case 'EXP_MIDI_PATTERN_ADD':
				return state.set(action.newPattern.id, makeExpMidiPatternViewState(action.newPattern))
			case 'EXP_MIDI_PATTERN_ADD_MANY':
				return state.merge(Map(action.newPatterns).map(makeExpMidiPatternViewState))
			case 'EXP_MIDI_PATTERN_DELETE':
				return state.delete(action.nodeId)
			case 'EXP_MIDI_PATTERN_DELETE_MANY':
				return state.deleteAll(action.nodeIds)
			case 'EXP_MIDI_PATTERN_REPLACE_ALL':
				return state.clear().merge(action.state).map(x => makeExpMidiPatternViewState(x))
			default: return state
		}
	}

export const selectExpMidiPatternViewsState = (state: IClientRoomState): ExpMidiPatternViewsState =>
	selectExpProjectState(state).state.midi.patternViews

export const selectExpMidiPatternView = (state: IClientRoomState, id: Id): ExpMidiPatternViewState =>
	selectExpMidiPatternViewsState(state).get(id) || defaultExpMidiPatternViewRecord
