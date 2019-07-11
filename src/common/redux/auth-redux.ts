import {Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {IClientAppState} from './common-redux-types'

export const AUTH_LOG_IN = 'AUTH_LOG_IN'
export const AUTH_LOG_OUT = 'AUTH_LOG_OUT'
export const AUTH_LOG_IN_ERROR = 'AUTH_LOG_IN_ERROR'

export const authActions = Object.freeze({
	logIn: (uid: string) => ({
		type: AUTH_LOG_IN as typeof AUTH_LOG_IN,
		uid,
	}),
	logOut: () => ({
		type: AUTH_LOG_OUT as typeof AUTH_LOG_OUT,
	}),
	logInError: () => ({
		type: AUTH_LOG_IN_ERROR as typeof AUTH_LOG_IN_ERROR,
	}),
})

const makeAuthState = Record({
	loggedIn: false,
	uid: 'dummyUID-init',
	logInError: false,
})

export class AuthState extends makeAuthState {}

export type AuthAction = ActionType<typeof authActions>

export function authReducer(state = new AuthState(), action: AuthAction): AuthState {
	switch (action.type) {
		case AUTH_LOG_IN: return {
			...state,
			loggedIn: true,
			uid: action.uid,
			logInError: false,
		}
		case AUTH_LOG_OUT: return {
			...state,
			loggedIn: false,
			uid: 'dummyUID-loggedOut',
			logInError: false,
		}
		case AUTH_LOG_IN_ERROR: return {
			...state,
			loggedIn: false,
			uid: 'dummyUID-logInError',
			logInError: true,
		}
		default: return state
	}
}

// Selectors
export const selectAuthState = (state: IClientAppState) => state.auth
