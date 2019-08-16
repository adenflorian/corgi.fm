import {Middleware} from 'redux'
import {
	AuthAction, chatSystemMessage, IClientAppState,
} from '@corgifm/common/redux'
import {corgiApiActions} from '../RestClient/corgi-api-middleware'
import {FirebaseContextStuff} from './FirebaseContext'

type AuthMiddlewareActions = AuthAction

type AuthMiddleware =
	(firebase: FirebaseContextStuff) => Middleware<{}, IClientAppState>

export const createAuthMiddleware: AuthMiddleware =
	(firebase: FirebaseContextStuff) => ({dispatch, getState}) =>
		next => async (action: AuthMiddlewareActions) => {
			next(action)

			switch (action.type) {
				case 'AUTH_ON_REGISTER': return onAuthRegister()
				case 'AUTH_ON_LOG_IN': return onAuthLogin()
				default: return
			}

			async function onAuthRegister() {
				const {currentUser} = firebase.auth

				if (!currentUser) return

				dispatch(chatSystemMessage('Registered!'))

				await currentUser.reload()

				if (currentUser.emailVerified !== true) {
					await currentUser.sendEmailVerification()
					dispatch(chatSystemMessage('Verification email sent!'))
				}
			}

			async function onAuthLogin() {
				dispatch(corgiApiActions.loadLocalUser())
				dispatch(corgiApiActions.loadLocalUserSamples())
			}
		}
