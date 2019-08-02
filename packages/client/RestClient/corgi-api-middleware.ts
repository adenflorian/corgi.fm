import {Middleware} from 'redux'
import {
	IClientAppState, IClientState, selectLocalClient, setClientName,
} from '@corgifm/common/redux'
import {User, UserUpdate} from '@corgifm/common/models/User'
import {Header} from '@corgifm/common/common-types'
import {ActionType} from 'typesafe-actions'
import {debounce} from 'lodash'
import {transformAndValidate} from '@corgifm/common/validation'
import {ContentType} from '@corgifm/common/common-constants'
import {FirebaseContextStuff} from '../Firebase/FirebaseContext'
import {getUrl} from '../client-utils'
import {logger} from '../client-logger'

const prefix = 'CORGI_API_'

export const corgiApiActions = {
	loadLocalUser: () => ({
		type: 'CORGI_API_LOAD_LOCAL_USER',
	} as const),
	saveLocalUser: () => ({
		type: 'CORGI_API_SAVE_LOCAL_USER',
	} as const),
} as const

type CorgiApiAction = ActionType<typeof corgiApiActions>

export function createCorgiApiMiddleware(
	firebase: FirebaseContextStuff
): Middleware<{}, IClientAppState> {

	let localUid: Id
	let jwt: string

	const putUserDebounced = debounce(_putUser, 2000)

	return ({dispatch, getState}) => next => async (action: CorgiApiAction) => {
		next(action)

		if (!action.type.startsWith(prefix)) return

		const {currentUser} = firebase.auth

		if (!currentUser) {
			return logger.error('[createCorgiApiMiddleware] expected a user')
		}

		localUid = currentUser.uid
		jwt = await currentUser.getIdToken()

		switch (action.type) {
			case 'CORGI_API_LOAD_LOCAL_USER': {
				const localClient = selectLocalClient(getState())
				const user = await getUserByUid(localUid, localClient)
				return dispatch(setClientName(localClient.id, user.displayName))
			}
			case 'CORGI_API_SAVE_LOCAL_USER': {
				const user = makeUserFromClient(selectLocalClient(getState()))
				return putUserDebounced(localUid, user)
			}
		}
	}

	async function getUserByUid(
		uid: Id, localClient?: IClientState
	): Promise<User> {
		const headers = {
			[Header.Authorization]: getAuthHeader(),
		} as const

		return fetch(`${getUrl()}/api/users/${uid}`, {headers})
			.then(async response => {
				if (response.status === 200) {
					return response.json()
				} else if (response.status === 404) {
					if (localClient) {
						// Try to update user if they don't already exist
						return _putUser(uid, makeUserFromClient(localClient))
							.then(async () => getUserByUid(uid))
					} else {
						throw new Error(`[getUserByUid] still a 404 after putting user`)
					}
				} else {
					throw new Error(`[getUserByUid] unexpected status ${response.status}`)
				}
			})
			.then(async data => transformAndValidate(User, data))
	}

	async function _putUser(
		uid: Id, user: UserUpdate,
	): Promise<void> {
		const headers = {
			[Header.Authorization]: getAuthHeader(),
			[Header.ContentType]: ContentType.ApplicationJson,
		} as const

		const options: RequestInit = {
			method: 'PUT',
			headers,
			body: JSON.stringify(user),
		}

		return fetch(`${getUrl()}/api/users/${uid}`, options)
			.then(response => {
				if (response.status !== 204) {
					throw new Error(`[putUser] unexpected status ${response.status}`)
				}
			})
	}

	function getAuthHeader() {
		return `Bearer ${jwt}`
	}

	function makeUserFromClient(client: IClientState): UserUpdate {
		return {
			displayName: client.name,
			color: client.color,
		}
	}
}
