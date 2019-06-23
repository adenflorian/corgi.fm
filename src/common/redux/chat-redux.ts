import {List} from 'immutable'
import {IClientRoomState} from './index'
import {BROADCASTER_ACTION, createReducer, SERVER_ACTION} from './index'

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

export interface IChatMessage {
	authorName: string
	color: string
	text: string
	isOldMessage?: boolean
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
	[SET_CHAT]: (state, {messages}: SetChatAction) => {
		return {
			...state,
			messages: messages.map(x => ({...x, isOldMessage: true})),
		}
	},
})

export const selectAllMessages = (state: IClientRoomState) => state.chat.messages
