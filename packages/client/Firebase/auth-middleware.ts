import {Middleware} from 'redux'
import {
	AuthAction, chatSystemMessage, IClientAppState,
	setClientName, selectLocalClient,
} from '@corgifm/common/redux'
import {User} from '@corgifm/common/models/User'
import {getUserByUid} from '../RestClient/corgi-api-client'
import {logger} from '../client-logger'
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
				const {currentUser} = firebase.auth

				if (!currentUser) return logger.error('[onAuthLogin] expected a user')

				const uid = currentUser.uid

				let user: User

				const localClient = selectLocalClient(getState())

				try {
					user = await getUserByUid(
						uid, await currentUser.getIdToken(), localClient)
				} catch (error) {
					logger.error('[onAuthLogin] error while getUserByUid: ', error)
					return
				}

				// TODO color
				dispatch(setClientName(localClient.id, user.displayName))
			}
		}
