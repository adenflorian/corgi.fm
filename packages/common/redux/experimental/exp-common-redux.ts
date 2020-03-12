import {RoomType} from '../../common-types'
import {IClientRoomState} from '../common-redux-types'

export function selectExpProjectState(state: IClientRoomState) {
	if (state.activity.activityType !== RoomType.Experimental) throw new Error('state.activity.activityType !== RoomType.Experimental')
	return state.activity
}

export function selectExpGraphsState(state: IClientRoomState) {
	return selectExpProjectState(state).state.graphs
}