import {List} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION} from '.'

export const roomOwnerRoomActions = List([
	'CHANGE_ONLY_OWNER_CAN_DO_STUFF',
	'SET_ROOM_OWNER',
] as const)

export type RoomOwnerRoomActionType = typeof roomOwnerRoomActions extends List<infer T> ? T : never

export function isRoomOwnerRoomAction(arg: string): arg is RoomOwnerRoomActionType {
	return roomOwnerRoomActions.includes(arg as RoomOwnerRoomActionType)
}

export const roomSettingsActions = {
	replaceAll: (settings: RoomSettings) => ({
		type: 'REPLACE_ALL_ROOM_SETTINGS',
		settings,
	} as const),
	changeLineType: (newLineType: LineType) => ({
		type: 'CHANGE_LINE_TYPE_ROOM_SETTING',
		newLineType,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	changeOnlyOwnerCanDoStuff: (onlyOwnerCanDoStuff: boolean) => ({
		type: 'CHANGE_ONLY_OWNER_CAN_DO_STUFF',
		onlyOwnerCanDoStuff,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	setOwner: (ownerId: Id) => ({
		type: 'SET_ROOM_OWNER',
		ownerId,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	setViewMode: (viewMode: RoomSettings['viewMode']) => ({
		type: 'ROOM_SETTINGS_SET_VIEW_MODE',
		viewMode,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
} as const

export enum LineType {
	Straight = 'Straight',
	Curved = 'Curved',
}

const initialState = Object.freeze({
	lineType: LineType.Curved,
	ownerId: '-1' as Id,
	onlyOwnerCanDoStuff: false,
	viewMode: 'debug' as 'debug' | 'normal'
})

export type RoomSettings = typeof initialState

export type RoomSettingsAction = ActionType<typeof roomSettingsActions>

export function roomSettingsReducer(settings = initialState, action: RoomSettingsAction): RoomSettings {
	switch (action.type) {
		case 'REPLACE_ALL_ROOM_SETTINGS': return action.settings
		case 'CHANGE_LINE_TYPE_ROOM_SETTING': return {...settings, lineType: action.newLineType}
		case 'CHANGE_ONLY_OWNER_CAN_DO_STUFF': return {...settings, onlyOwnerCanDoStuff: action.onlyOwnerCanDoStuff}
		case 'SET_ROOM_OWNER': return {...settings, ownerId: action.ownerId}
		case 'ROOM_SETTINGS_SET_VIEW_MODE': return {...settings, viewMode: action.viewMode}
		default: return settings
	}
}

export const selectRoomSettings = (state: IClientRoomState) => state.roomSettings
