import {AnyAction} from 'redux'
import {RoomType} from '../common-types'

interface NormalActivityState {
	readonly activityType: RoomType.Normal
}

export function normalActivityReducer(
	state: NormalActivityState = {activityType: RoomType.Normal},
	action: AnyAction,
): NormalActivityState {
	return state
}
