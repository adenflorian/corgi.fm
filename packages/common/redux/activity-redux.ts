import {Reducer} from 'redux'
import {ActionType} from 'typesafe-actions'
import {IClientRoomState} from './common-redux-types'
import {
	BROADCASTER_ACTION, SERVER_ACTION, expProjectReducer,
} from '.'
import {dummyActivityReducer} from './dummy-activity-redux'
import {commonActions} from './common-actions'

export const activityActions = {
	replace: (activityState: ActivityState) => ({
		type: 'ACTIVITY_REPLACE',
		activityState,
	} as const),
	set: (activity: Activity) => ({
		type: 'ACTIVITY_SET',
		activity,
	} as const),
} as const

const activityReducers = {
	expCorgi: expProjectReducer,
	dummy: dummyActivityReducer,
}

export interface ActivityStateBase {
	readonly activity: string
}

export type ActivityReducer = typeof activityReducers[keyof typeof activityReducers]

export type ActivityState = ReturnType<ActivityReducer>

export type Activity = ActivityState['activityType']

export type ActivityAction = ActionType<typeof activityActions>

export const activityReducer: Reducer<ActivityState, ActivityAction> = (
	state = {activityType: 'dummy'}, action,
) => {
	switch (action.type) {
		case 'ACTIVITY_REPLACE': return getReducer(action.activityState)(undefined, action)
		case 'ACTIVITY_SET': return activityReducers[action.activity](undefined, commonActions.init())
		default: return getReducer(state)(state, action)
	}
}

function getReducer<T extends ActivityState>(state: T): Reducer<T> {
	return activityReducers[state.activityType] as Reducer<T>
}

export function selectActivityState(state: IClientRoomState) {
	return state.activity
}
