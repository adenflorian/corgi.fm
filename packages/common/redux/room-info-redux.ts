import {Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {logger} from '../logger';
import {IClientRoomState} from '.';

export const roomInfoAction = {
	setType: (roomType: RoomType) => ({
		type: 'SET_ROOM_TYPE',
		roomType,
	} as const),
	replace: (state: RoomInfoState) => ({
		type: 'REPLACE_ROOM_INFO_STATE',
		state,
	} as const),
} as const

export type RoomInfosAction = ActionType<typeof roomInfoAction>

export enum RoomType {
	Normal = 'Normal',
	Experimental = 'Experimental',
}

export const getRoomTypeFriendlyString = (type: RoomType) => {
	switch (type) {
		case RoomType.Normal: return 'Classic'
		case RoomType.Experimental: return 'Experimental'
	}
}

const makeRoomInfoState = Record({
	roomType: RoomType.Normal,
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
		case 'SET_ROOM_TYPE': return setRoomType(state, action.roomType)
		case 'REPLACE_ROOM_INFO_STATE': return makeRoomInfoState(action.state)
		default: return state
	}
}

function setRoomType(state: RoomInfoState, roomType: RoomType): RoomInfoState {
	if (isRoomType(roomType)) {
		return state.set('roomType', roomType)
	} else {
		logger.error('invalid room type: ', {state, roomType})
		return state
	}
}

export const selectRoomInfoState = (state: IClientRoomState) =>
	state.roomInfo
