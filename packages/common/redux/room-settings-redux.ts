import {List} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {Id} from '../common-types'
import {BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION} from '.'

export const REPLACE_ALL_ROOM_SETTINGS = 'REPLACE_ALL_ROOM_SETTINGS'
export const CHANGE_LINE_TYPE_ROOM_SETTING = 'CHANGE_LINE_TYPE_ROOM_SETTING'
export const CHANGE_ONLY_OWNER_CAN_DO_STUFF = 'CHANGE_ONLY_OWNER_CAN_DO_STUFF'
export const SET_ROOM_OWNER = 'SET_ROOM_OWNER'

export const roomOwnerRoomActions = List([
	CHANGE_ONLY_OWNER_CAN_DO_STUFF,
	SET_ROOM_OWNER,
])

export const roomSettingsActions = Object.freeze({
	replaceAll: (settings: RoomSettings) => ({
		type: REPLACE_ALL_ROOM_SETTINGS as typeof REPLACE_ALL_ROOM_SETTINGS,
		settings,
	}),
	changeLineType: (newLineType: LineType) => ({
		type: CHANGE_LINE_TYPE_ROOM_SETTING as typeof CHANGE_LINE_TYPE_ROOM_SETTING,
		newLineType,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	changeOnlyOwnerCanDoStuff: (onlyOwnerCanDoStuff: boolean) => ({
		type: CHANGE_ONLY_OWNER_CAN_DO_STUFF as typeof CHANGE_ONLY_OWNER_CAN_DO_STUFF,
		onlyOwnerCanDoStuff,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	setOwner: (ownerId: Id) => ({
		type: SET_ROOM_OWNER as typeof SET_ROOM_OWNER,
		ownerId,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
})

export enum LineType {
	Straight = 'Straight',
	Curved = 'Curved',
}

const initialState = Object.freeze({
	lineType: LineType.Curved,
	ownerId: '-1',
	onlyOwnerCanDoStuff: false,
})

export type RoomSettings = typeof initialState

export type RoomSettingsAction = ActionType<typeof roomSettingsActions>

export function roomSettingsReducer(settings = initialState, action: RoomSettingsAction): RoomSettings {
	switch (action.type) {
		case REPLACE_ALL_ROOM_SETTINGS: return action.settings
		case CHANGE_LINE_TYPE_ROOM_SETTING: return {...settings, lineType: action.newLineType}
		case CHANGE_ONLY_OWNER_CAN_DO_STUFF: return {...settings, onlyOwnerCanDoStuff: action.onlyOwnerCanDoStuff}
		case SET_ROOM_OWNER: return {...settings, ownerId: action.ownerId}
		default: return settings
	}
}

export const selectRoomSettings = (state: IClientRoomState) => state.roomSettings
