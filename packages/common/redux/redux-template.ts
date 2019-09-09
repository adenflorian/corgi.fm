// import {Map, Record} from 'immutable'
// import {ActionType} from 'typesafe-actions'
// import {MidiClipEvent} from '../midi-types'

// export const recordingActions = {
// 	startEvent: () => ({
// 		type: 'RECORDING_START_EVENT',
// 	} as const),
// } as const

// const makeRecordingState = Record({
// 	recordingEvents: Map<Id, MidiClipEvent>(),
// })

// export type RecordingState = ReturnType<typeof makeRecordingState>

// export type RecordingAction = ActionType<typeof recordingActions>

// export const recordingReducer = (state = makeRecordingState(), action: RecordingAction) => {
// 	switch (action.type) {
// 		default: return state
// 	}
// }
