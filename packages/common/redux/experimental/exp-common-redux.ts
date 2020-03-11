import {IClientRoomState} from '../common-redux-types'

export function selectExpProjectState(state: IClientRoomState) {
	if (state.activity.activityType !== 'expCorgi') throw new Error('state.activity.activityType !== expCorgi')
	return state.activity
}

export function selectExpGraphsState(state: IClientRoomState) {
	return selectExpProjectState(state).state.graphs
}