import {Map, Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import * as uuid from 'uuid'
import {IMidiNote} from '../MidiNote'
import {
	BROADCASTER_ACTION,	SERVER_ACTION,
} from '.'

export const recordingActions = {
	startEvent: (newEvent: NewRecordingEvent) => ({
		type: 'RECORDING_START_EVENT',
		event: newEvent,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	endEvent: (eventId: Id) => ({
		type: 'RECORDING_END_EVENT',
		SERVER_ACTION,
		BROADCASTER_ACTION,
		eventId,
	} as const),
} as const

const makeRecordingState = Record({
	recordingEvents: Map<Id, RecordingEvent>(),
})

type RecordingEvents = RecordingState['recordingEvents']

interface RecordingEvent {
	readonly id: Id
	readonly ownerId: Id
	readonly startBeat: number
	readonly note: IMidiNote
	readonly sequencerId: Id
}

type NewRecordingEvent = Omit<RecordingEvent, 'id'>

function makeRecordingEvent(event: NewRecordingEvent): RecordingEvent {
	return {
		...event,
		id: uuid.v4(),
	}
}

export type RecordingState = ReturnType<typeof makeRecordingState>

export type RecordingAction = ActionType<typeof recordingActions>

export const recordingReducer = (state = makeRecordingState(), action: RecordingAction) => {
	switch (action.type) {
		case 'RECORDING_START_EVENT': return state.update('recordingEvents', _startEvent(action.event))
		case 'RECORDING_END_EVENT': return state.update('recordingEvents', _endEvent(action.eventId))
		default: return state
	}
}

function _startEvent(newEvent: NewRecordingEvent) {
	return (events: RecordingEvents): RecordingEvents => {
		const event = makeRecordingEvent(newEvent)
		return events.set(event.id, event)
	}
}

function _endEvent(eventId: Id) {
	return (events: RecordingEvents) => events.delete(eventId)
}
