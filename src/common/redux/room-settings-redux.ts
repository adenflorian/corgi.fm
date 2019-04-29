import {ActionType} from 'typesafe-actions'
import {IClientRoomState} from './common-redux-types'

export const REPLACE_ALL_ROOM_SETTINGS = 'REPLACE_ALL_ROOM_SETTINGS'

export const roomSettingsActions = Object.freeze({
	replaceAll: (settings: RoomSettings) => ({
		type: REPLACE_ALL_ROOM_SETTINGS as typeof REPLACE_ALL_ROOM_SETTINGS,
		settings,
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

export function roomSettingsReducer(settings = initialState, action: RoomSettingsAction) {
	switch (action.type) {
		default: return settings
	}
}

export const selectRoomSettings = (state: IClientRoomState) => state.roomSettings
