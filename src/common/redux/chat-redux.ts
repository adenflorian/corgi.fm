import {IAppState} from './configureStore'
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

export interface IChatState {
	messages: IChatMessage[]
}

export interface IChatMessage {
	authorName?: string
	authorId: string
	color?: string
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
		default: return state
	}
}

export const selectAllMessages = (state: IAppState) => state.chat.messages
