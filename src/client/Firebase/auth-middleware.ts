import {Middleware} from 'redux'
import {AUTH_ON_REGISTER, AuthAction, IClientAppState} from '../../common/redux'
import {FirebaseContextStuff} from './FirebaseContext'

type AuthMiddlewareActions = AuthAction

export const createAuthMiddleware: (firebase: FirebaseContextStuff) => Middleware<{}, IClientAppState> =
	(firebase: FirebaseContextStuff) => ({dispatch, getState}) => next => async (action: AuthMiddlewareActions) => {

		next(action)

		switch (action.type) {
			case AUTH_ON_REGISTER: return await onAuthRegister()
			default: return
		}

		async function onAuthRegister() {
			const {currentUser} = firebase.auth

			if (!currentUser) return

			await currentUser.reload()

			if (currentUser.emailVerified !== true) {
				await currentUser.sendEmailVerification()
			}
		}
	}
