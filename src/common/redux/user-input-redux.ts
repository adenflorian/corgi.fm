import {Record} from 'immutable'
import {combineReducers, Reducer} from 'redux'
import {ActionType} from 'typesafe-actions'
import {IClientAppState} from './index'

export const SET_USER_INPUT = 'SET_USER_INPUT'
export const USER_KEY_PRESS = 'USER_KEY_PRESS'

export enum UserKeys {
	Backspace = 'Backspace',
}

export const userInputActions = Object.freeze({
	setKeys: (keys: Partial<UserInputKeysState>) => ({
		type: SET_USER_INPUT as typeof SET_USER_INPUT,
		keys,
	}),
	keyPress: (key: string) => ({
		type: USER_KEY_PRESS as typeof USER_KEY_PRESS,
		key,
	}),
})

export const makeUserInputKeysState = Record({
	ctrl: false,
	alt: false,
	shift: false,
})

export type UserInputKeysState = ReturnType<typeof makeUserInputKeysState>

export interface UserInputState {
	keys: UserInputKeysState
}

export type UserInputAction = ActionType<typeof userInputActions>

const userInputKeysReducer: Reducer<UserInputKeysState, UserInputAction> =
	(state = makeUserInputKeysState(), action) => {
		switch (action.type) {
			case SET_USER_INPUT: return state.merge(action.keys)
			default: return state
		}
	}

export const userInputReducer = combineReducers<UserInputState, UserInputAction>({
	keys: userInputKeysReducer,
})

export const selectUserInputKeys = (state: IClientAppState) => state.userInput.keys
