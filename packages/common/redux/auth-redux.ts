import * as firebase from 'firebase'
import {Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {useSelector} from 'react-redux'
import {IClientAppState} from './common-redux-types'

export const authActions = {
	logIn: (user: firebase.User) => ({
		type: 'AUTH_ON_LOG_IN',
		user,
	} as const),
	logOut: () => ({
		type: 'AUTH_ON_LOG_OUT',
	} as const),
	logInError: () => ({
		type: 'AUTH_ON_LOG_IN_ERROR',
	} as const),
	onRegister: () => ({
		type: 'AUTH_ON_REGISTER',
	} as const),
} as const

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
		case 'AUTH_ON_LOG_IN': return new AuthState({
			loggedIn: true,
			uid: action.user.uid,
			isEmailVerified: action.user.emailVerified,
		})
		case 'AUTH_ON_LOG_OUT': return new AuthState()
		case 'AUTH_ON_LOG_IN_ERROR': return new AuthState({logInError: true})
		default: return state
	}
}

// Selectors
export const selectAuthState = (state: IClientAppState) => state.auth

const selectLoggedIn = (state: IClientAppState) => state.auth.loggedIn

export function useLoggedIn() {
	return useSelector(selectLoggedIn)
}
