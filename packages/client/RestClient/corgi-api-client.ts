import {User, UserUpdate} from '@corgifm/common/models/User'
import {transformAndValidate} from '@corgifm/common/validation'
import {Header} from '@corgifm/common/common-types'
import {IClientState} from '@corgifm/common/redux'
import {ContentType} from '@corgifm/common/common-constants'
import {getUrl} from '../client-utils'

export async function getUserByUid(
	uid: string, jwt: string, localClient?: IClientState
): Promise<User> {
	const headers = {
		[Header.Authorization]: `Bearer ${jwt}`,
	} as const

	return fetch(`${getUrl()}/api/users/${uid}`, {headers})
		.then(async response => {
			if (response.status === 200) {
				return response.json()
			} else if (response.status === 404) {
				if (localClient) {
					const user = {
						displayName: localClient.name,
						color: localClient.color,
					}
					return putUser(uid, user, jwt)
						.then(async () => getUserByUid(uid, jwt))
				} else {
					throw new Error(`[getUserByUid] still a 404 after putting user`)
				}
			} else {
				throw new Error(`[getUserByUid] unexpected status ${response.status}`)
			}
		})
		.then(async data => transformAndValidate(User, data))
}

export async function putUser(
	uid: string, user: UserUpdate, jwt: string
): Promise<void> {
	const headers = {
		[Header.Authorization]: `Bearer ${jwt}`,
		[Header.ContentType]: ContentType.ApplicationJson,
	} as const

	const options: RequestInit = {
		method: 'PUT',
		headers,
		body: JSON.stringify(user),
	}

	return fetch(`${getUrl()}/api/users/${uid}`, options)
		.then(async response => {
			if (response.status === 204) {
				return
			} else {
				throw new Error(`[putUser] unexpected status ${response.status}`)
			}
		})
}
