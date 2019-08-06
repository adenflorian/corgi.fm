import {List, Map} from 'immutable'
import {CssColor} from '../shamu-color'
import {IClientRoomState, BROADCASTER_ACTION, createReducer, SERVER_ACTION} from '.'

export type SystemMessageType = 'info' | 'error' | 'warning' | 'success'

const systemColors = Map<SystemMessageType, string>([
	['info', CssColor.defaultGray],
	['warning', CssColor.yellow],
	['error', CssColor.red],
	['success', CssColor.green],
])

export const CHAT_SUBMIT = 'CHAT_SUBMIT'
export type ChatSubmitAction = ReturnType<typeof chatSubmit>
export const chatSubmit = (message: IChatMessage) => {
	return {
		type: CHAT_SUBMIT,
		BROADCASTER_ACTION,
		SERVER_ACTION,
		message,
	}
}

export const CHAT_SYSTEM_MESSAGE = 'CHAT_SYSTEM_MESSAGE'
export type ChatSystemMessageAction = ReturnType<typeof chatSystemMessage>
export const chatSystemMessage = (message: string, type: SystemMessageType = 'info') => {
	return {
		type: CHAT_SYSTEM_MESSAGE,
		message: new IChatMessage(
			'System',
			systemColors.get(type, CssColor.defaultGray),
			message,
		),
	}
}

export const SET_CHAT = 'SET_CHAT'
export type SetChatAction = ReturnType<typeof setChat>
export const setChat = (messages: IChatMessage[]) => {
	return {
		type: SET_CHAT,
		BROADCASTER_ACTION,
		messages,
	}
}

export const chatActionTypesWhitelist = List([
	CHAT_SUBMIT,
])

export interface IChatState {
	messages: IChatMessage[]
}

export class IChatMessage {
	public constructor(
		public readonly authorName: string,
		public readonly color: string,
		public readonly text: string,
		public readonly isOldMessage?: boolean,
	) {}
}

const initialState: IChatState = {
	messages: [],
}

export const chatReducer = createReducer(initialState, {
	[CHAT_SUBMIT]: (state, {message}: ChatSubmitAction) => {
		return {
			...state,
			messages: state.messages.concat(message),
		}
	},
	[CHAT_SYSTEM_MESSAGE]: (state, {message}: ChatSystemMessageAction) => {
		return {
			...state,
			messages: state.messages.concat(message),
		}
	},
	[SET_CHAT]: (state, {messages}: SetChatAction) => {
		return {
			...state,
			messages: messages.map(x => ({...x, isOldMessage: true})),
		}
	},
})

export const selectAllMessages = (state: IClientRoomState) => state.chat.messages
