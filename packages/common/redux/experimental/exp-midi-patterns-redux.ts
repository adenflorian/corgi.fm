import {Map, Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {SeqEvents, SeqEvent} from '../../SeqStuff'
import {
	BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION,
} from '..'
import {selectExpProjectState} from '.'

export const expMidiPatternsActions = {
	add: (newPattern: ExpMidiPatternState) => ({
		type: 'EXP_MIDI_PATTERN_ADD' as const,
		isExpMidiPatternAction: true,
		newPattern,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	addMany: (newPatterns: Map<Id, ExpMidiPatternState>) => ({
		type: 'EXP_MIDI_PATTERN_ADD_MANY' as const,
		isExpMidiPatternAction: true,
		newPatterns,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	delete: (nodeId: Id) => ({
		type: 'EXP_MIDI_PATTERN_DELETE' as const,
		isExpMidiPatternAction: true,
		nodeId,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	deleteMany: (nodeIds: readonly Id[]) => ({
		type: 'EXP_MIDI_PATTERN_DELETE_MANY' as const,
		isExpMidiPatternAction: true,
		nodeIds,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	replaceAll: (state: ExpMidiPatternsState) => ({
		type: 'EXP_MIDI_PATTERN_REPLACE_ALL' as const,
		isExpMidiPatternAction: true,
		state,
	} as const),
} as const

export type ExpMidiPatternsAction = ActionType<typeof expMidiPatternsActions>

const defaultExpMidiPatternState = {
	id: 'dummyId' as Id,
	name: 'dummyOwnerId',
	events: Map<Id, SeqEvent>() as SeqEvents,
}

const _makeExpMidiPatternState = Record(defaultExpMidiPatternState)

export const defaultExpMidiPatternRecord: ExpMidiPatternState = _makeExpMidiPatternState()

export function makeExpMidiPatternState(pattern: Partial<typeof defaultExpMidiPatternState>): ExpMidiPatternState {
	return _makeExpMidiPatternState(pattern)
		.set('id', pattern.id || uuid.v4())
		.set('events', Map<Id, SeqEvent>(pattern.events || Map()))
}

export interface ExpMidiPatternState extends ReturnType<typeof _makeExpMidiPatternState> {}

const initialState = Map<Id, ExpMidiPatternState>()

export type ExpMidiPatternsState = typeof initialState

export const expMidiPatternsReducer = (state = initialState, action: ExpMidiPatternsAction): ExpMidiPatternsState => {
	switch (action.type) {
		case 'EXP_MIDI_PATTERN_ADD': return state.set(action.newPattern.id, makeExpMidiPatternState(action.newPattern))
		case 'EXP_MIDI_PATTERN_ADD_MANY': return state.merge(Map(action.newPatterns).map(makeExpMidiPatternState))
		case 'EXP_MIDI_PATTERN_DELETE': return state.delete(action.nodeId)
		case 'EXP_MIDI_PATTERN_DELETE_MANY': return state.deleteAll(action.nodeIds)
		case 'EXP_MIDI_PATTERN_REPLACE_ALL': return state.clear().merge(action.state).map(x => makeExpMidiPatternState(x))
		default: return state
	}
}

export const selectExpMidiPatternsState = (state: IClientRoomState): ExpMidiPatternsState => selectExpProjectState(state).state.midi.patterns

export const selectExpMidiPattern = (state: IClientRoomState, id: Id): ExpMidiPatternState =>
	selectExpMidiPatternsState(state).get(id) || defaultExpMidiPatternRecord
