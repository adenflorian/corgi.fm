import {Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {logger} from '../logger'
import {IClientRoomState} from '.'
import {RoomType} from '../common-types'

export const roomInfoAction = {
	replace: (state: RoomInfoState) => ({
		type: 'REPLACE_ROOM_INFO_STATE',
		state,
	} as const),
} as const

export type RoomInfosAction = ActionType<typeof roomInfoAction>

export const getRoomTypeFriendlyString = (type: RoomType) => {
	switch (type) {
		case RoomType.Normal: return 'Classic'
		case RoomType.Experimental: return 'Experimental'
		case RoomType.Dummy: return 'Dummy'
	}
}

const makeRoomInfoState = Record({
})

export function isRoomType(val: string): val is RoomType {
	return Object.keys(RoomType).includes(val)
}

type RoomInfoState = ReturnType<typeof makeRoomInfoState>

export enum RoomInfoId {
	Auth = 'Auth',
	Welcome = 'Welcome',
	Options = 'Options',
	LoadRoom = 'LoadRoom',
	NewRoom = 'NewRoom',
	None = 'None',
}

export const roomInfoReducer = (
	state = makeRoomInfoState(), action: RoomInfosAction,
): RoomInfoState => {
	switch (action.type) {
		case 'REPLACE_ROOM_INFO_STATE': return makeRoomInfoState(action.state)
		default: return state
	}
}

export const selectRoomInfoState = (state: IClientRoomState) =>
	state.roomInfo
