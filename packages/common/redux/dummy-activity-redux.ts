import {AnyAction} from 'redux'
import {RoomType} from '../common-types'

interface DummyActivityState {
	readonly activityType: RoomType.Dummy
}

export function dummyActivityReducer(
	state: DummyActivityState = {activityType: RoomType.Dummy},
	action: AnyAction,
): DummyActivityState {
	return state
}
