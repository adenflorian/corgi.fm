import {IClientAppState} from './client-store'
import {BROADCASTER_ACTION, SERVER_ACTION} from './redux-utils'

export const CHAT_SUBMIT = 'CHAT_SUBMIT'
export const chatSubmit = (message: IChatMessage) => {
	return {
		type: CHAT_SUBMIT,
		BROADCASTER_ACTION,
		SERVER_ACTION,
		message,
	}
}

export const SET_CHAT = 'SET_CHAT'
export const setChat = (messages: IChatMessage[]) => {
	return {
		type: SET_CHAT,
		BROADCASTER_ACTION,
		messages,
	}
}

export interface IChatState {
	messages: IChatMessage[]
}

export interface IChatMessage {
	authorName: string
	color: string
	text: string
}

const initialState = {
	messages: [],
}

export function chatReducer(state: IChatState = initialState, action): IChatState {
	switch (action.type) {
		case CHAT_SUBMIT: return {
			...state,
			messages: state.messages.concat(action.message),
		}
		case SET_CHAT: return {
			...state,
			messages: action.messages,
		}
		default: return state
	}
}

export const selectAllMessages = (state: IClientAppState) => state.chat.messages
