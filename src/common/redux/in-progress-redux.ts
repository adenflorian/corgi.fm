import {Map} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {IClientAppState} from '.'

export const SET_IN_PROGRESS = 'SET_IN_PROGRESS'

export const inProgressAction = Object.freeze({
	set: (id: InProgressId, data: InProgress) => ({
		type: SET_IN_PROGRESS as typeof SET_IN_PROGRESS,
		id,
		data,
	}),
})

type InProgressState = Map<InProgressId, InProgress>

const makeInProgressState = () => Map<InProgressId, InProgress>()

export interface InProgress {
	inProgress: boolean
}

export enum InProgressId {
	NewRoom = 'NewRoom',
}

export type InProgressAction = ActionType<typeof inProgressAction>

const initialState = makeInProgressState()

export function inProgressReducer(
	state = initialState, action: InProgressAction,
): InProgressState {

	switch (action.type) {
		case SET_IN_PROGRESS: return state.set(action.id, action.data)
		default: return state
	}
}

export const selectInProgressState = (state: IClientAppState) =>
	state.inProgress
