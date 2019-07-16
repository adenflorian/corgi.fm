import * as firebase from 'firebase'
import {Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {IClientAppState} from './common-redux-types'

export const AUTH_ON_LOG_IN = 'AUTH_ON_LOG_IN'
export const AUTH_ON_LOG_OUT = 'AUTH_ON_LOG_OUT'
export const AUTH_ON_LOG_IN_ERROR = 'AUTH_ON_LOG_IN_ERROR'
export const AUTH_ON_REGISTER = 'AUTH_ON_REGISTER'

export const authActions = Object.freeze({
	logIn: (user: firebase.User) => ({
		type: AUTH_ON_LOG_IN as typeof AUTH_ON_LOG_IN,
		user,
	}),
	logOut: () => ({
		type: AUTH_ON_LOG_OUT as typeof AUTH_ON_LOG_OUT,
	}),
	logInError: () => ({
		type: AUTH_ON_LOG_IN_ERROR as typeof AUTH_ON_LOG_IN_ERROR,
	}),
	onRegister: () => ({
		type: AUTH_ON_REGISTER as typeof AUTH_ON_REGISTER,
	}),
})

const makeAuthState = Record({
	loggedIn: false,
	uid: 'dummyUID-init',
	logInError: false,
	isEmailVerified: false,
	emailVerificationSentTime: undefined,
})

export class AuthState extends makeAuthState {}

export type AuthAction = ActionType<typeof authActions>

export function authReducer(state = new AuthState(), action: AuthAction): AuthState {
	switch (action.type) {
		case AUTH_ON_LOG_IN: return new AuthState({
			loggedIn: true,
			uid: action.user.uid,
			isEmailVerified: action.user.emailVerified,
		})
		case AUTH_ON_LOG_OUT: return new AuthState()
		case AUTH_ON_LOG_IN_ERROR: return new AuthState({logInError: true})
		default: return state
	}
}

// Selectors
export const selectAuthState = (state: IClientAppState) => state.auth

export const selectLoggedIn = (state: IClientAppState) => state.auth.loggedIn
