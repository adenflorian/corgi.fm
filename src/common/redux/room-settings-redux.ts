import {ActionType} from 'typesafe-actions'
import {BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION} from './index'

export const REPLACE_ALL_ROOM_SETTINGS = 'REPLACE_ALL_ROOM_SETTINGS'
export const CHANGE_LINE_TYPE_ROOM_SETTING = 'CHANGE_LINE_TYPE_ROOM_SETTING'

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
})

export enum LineType {
	Straight = 'Straight',
	Curved = 'Curved',
}

const initialState = Object.freeze({
	lineType: LineType.Curved,
})

export type RoomSettings = typeof initialState

export type RoomSettingsAction = ActionType<typeof roomSettingsActions>

export function roomSettingsReducer(settings = initialState, action: RoomSettingsAction): RoomSettings {
	switch (action.type) {
		case REPLACE_ALL_ROOM_SETTINGS: return action.settings
		case CHANGE_LINE_TYPE_ROOM_SETTING: return {...settings, lineType: action.newLineType}
		default: return settings
	}
}

export const selectRoomSettings = (state: IClientRoomState) => state.roomSettings
