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
	// addMany: (newPatterns: Map<Id, ExpMidiPatternState>) => ({
	// 	type: 'EXP_MIDI_PATTERN_ADD_MANY' as const,
	// 	isExpMidiPatternAction: true,
	// 	newPatterns,
	// 	BROADCASTER_ACTION,
	// 	SERVER_ACTION,
	// } as const),
	delete: (id: Id) => ({
		type: 'EXP_MIDI_PATTERN_DELETE' as const,
		isExpMidiPatternAction: true,
		id,
		BROADCASTER_ACTION,
		SERVER_ACTION,
	} as const),
	// deleteMany: (nodeIds: readonly Id[]) => ({
	// 	type: 'EXP_MIDI_PATTERN_DELETE_MANY' as const,
	// 	isExpMidiPatternAction: true,
	// 	nodeIds,
	// 	BROADCASTER_ACTION,
	// 	SERVER_ACTION,
	// } as const),
	// replaceAll: (state: ExpMidiPatternsState) => ({
	// 	type: 'EXP_MIDI_PATTERN_REPLACE_ALL' as const,
	// 	isExpMidiPatternAction: true,
	// 	state,
	// } as const),
	addEvent: (id: Id, event: SeqEvent) => ({
		type: 'EXP_MIDI_PATTERN_ADD_EVENT',
		id,
		event,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	addEvents: (id: Id, events: SeqEvents) => ({
		type: 'EXP_MIDI_PATTERN_ADD_EVENTS',
		id,
		events,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	updateEvents: (id: Id, events: SeqEvents, saveUndo = true) => ({
		type: 'EXP_MIDI_PATTERN_UPDATE_EVENTS',
		id,
		events,
		saveUndo,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	deleteEvents: (id: Id, idsToDelete: Iterable<Id>) => ({
		type: 'EXP_MIDI_PATTERN_DELETE_EVENTS',
		id,
		idsToDelete,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
} as const

export type ExpMidiPatternsAction = ActionType<typeof expMidiPatternsActions>

const defaultExpMidiPatternState = {
	id: 'dummyId' as Id,
	name: 'dummyOwnerId' as string,
	events: Map<Id, SeqEvent>() as SeqEvents,
} as const

const _makeExpMidiPatternState = Record(defaultExpMidiPatternState)

export const defaultExpMidiPatternRecord: ExpMidiPatternState = _makeExpMidiPatternState()

export function makeExpMidiPatternState(pattern: Partial<typeof defaultExpMidiPatternState>): ExpMidiPatternState {
	return _makeExpMidiPatternState(pattern)
		.set('id', pattern.id || uuid.v4())
		.set('events', Map<Id, SeqEvent>(pattern.events || Map()))
}

export function makeExpMidiPatternEvents(
	events: readonly (Pick<SeqEvent, 'note' | 'startBeat' | 'duration'> & Partial<SeqEvent>)[],
): SeqEvents {
	return events.reduce((map, event) => {
		const newEvent: SeqEvent = {
			...event,
			id: event.id || uuid.v4(),
			type: event.type || 'note',
			velocity: event.velocity !== undefined ? event.velocity : 1,
			active: event.active !== undefined ? event.active : true,
		}
		return map.set(newEvent.id, newEvent)
	}, Map<Id, SeqEvent>())
}

export interface ExpMidiPatternState extends ReturnType<typeof _makeExpMidiPatternState> {}

export type ExpMidiPatternStateRaw = typeof defaultExpMidiPatternState

const initialState = Map<Id, ExpMidiPatternState>()

export type ExpMidiPatternsState = typeof initialState

export const expMidiPatternsReducer = (state = initialState, action: ExpMidiPatternsAction): ExpMidiPatternsState => {
	switch (action.type) {
		case 'EXP_MIDI_PATTERN_ADD':
			return state.set(action.newPattern.id, makeExpMidiPatternState(action.newPattern))
		// case 'EXP_MIDI_PATTERN_ADD_MANY':
		// 	return state.merge(Map(action.newPatterns).map(makeExpMidiPatternState))
		case 'EXP_MIDI_PATTERN_DELETE':
			return state.delete(action.id)
		// case 'EXP_MIDI_PATTERN_DELETE_MANY':
		// 	return state.deleteAll(action.nodeIds)
		// case 'EXP_MIDI_PATTERN_REPLACE_ALL':
		// 	return state.clear().merge(action.state).map(x => makeExpMidiPatternState(x))
		case 'EXP_MIDI_PATTERN_ADD_EVENT':
			return state.update(action.id, defaultExpMidiPatternRecord,
				x => x.update('events', x => x.set(action.event.id, action.event)))
		case 'EXP_MIDI_PATTERN_ADD_EVENTS':
			return state.update(action.id, defaultExpMidiPatternRecord,
				x => x.update('events', x => x.merge(action.events)))
		case 'EXP_MIDI_PATTERN_UPDATE_EVENTS':
			// TODO Handle undo (action.saveUndo)
			return state.update(action.id, defaultExpMidiPatternRecord,
				x => x.update('events', x => x.merge(action.events)))
		case 'EXP_MIDI_PATTERN_DELETE_EVENTS':
			return state.update(action.id, defaultExpMidiPatternRecord,
				x => x.update('events', x => x.deleteAll(action.idsToDelete)))
		default: return state
	}
}

export const selectExpMidiPatternsState = (state: IClientRoomState): ExpMidiPatternsState => selectExpProjectState(state).state.midi.patterns

export const selectExpMidiPattern = (state: IClientRoomState, id: Id): ExpMidiPatternState =>
	selectExpMidiPatternsState(state).get(id) || defaultExpMidiPatternRecord
