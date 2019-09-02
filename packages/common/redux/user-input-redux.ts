import {Record} from 'immutable'
import {combineReducers, Reducer} from 'redux'
import {ActionType} from 'typesafe-actions'
import {IClientAppState} from '.'

export enum UserKeys {
	Backspace = 'Backspace',
}

export const userInputActions = {
	setKeys: (keys: Partial<UserInputKeysState>) => ({
		type: 'SET_USER_INPUT',
		keys,
	} as const),
	keyPress: (key: string) => ({
		type: 'USER_KEY_PRESS',
		key,
	} as const),
	localMidiSustainPedal: (pressed: boolean) => ({
		type: 'LOCAL_MIDI_SUSTAIN_PEDAL',
		pressed,
	} as const),
} as const

export const makeUserInputKeysState = Record({
	ctrl: false,
	alt: false,
	shift: false,
	sustainPedalPressed: false,
})

export type UserInputKeysState = ReturnType<typeof makeUserInputKeysState>

export interface UserInputState {
	keys: UserInputKeysState
}

export type UserInputAction = ActionType<typeof userInputActions>

const userInputKeysReducer: Reducer<UserInputKeysState, UserInputAction> =
	(state = makeUserInputKeysState(), action) => {
		switch (action.type) {
			case 'SET_USER_INPUT': return state.merge(action.keys)
			case 'LOCAL_MIDI_SUSTAIN_PEDAL': return state.set('sustainPedalPressed', action.pressed)
			default: return state
		}
	}

export const userInputReducer = combineReducers<UserInputState, UserInputAction>({
	keys: userInputKeysReducer,
})

export const selectUserInputKeys = (state: IClientAppState) => state.userInput.keys
