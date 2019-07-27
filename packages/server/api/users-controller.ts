import {UserUpdate} from '@corgifm/common/models/User'
import {selectAllClients} from '@corgifm/common/redux'
import * as pathToRegexp from 'path-to-regexp'
import {DBStore} from '../database/database'
import {ServerStore} from '../server-redux-types'
import {routeIfSecure} from '../security-middleware'
import {validateBodyThenRoute} from '../server-validation'
import {
	SecureUsersApiRequest, ApiResponse, ApiRequest, Method, SecureApiRequest,
	defaultResponse,
} from './api-types'

export function getUsersRouter(serverStore: ServerStore, dbStore: DBStore) {

	return async function usersRouter(request: ApiRequest): Promise<ApiResponse> {
		if (request.path === '/users/count' && request.method === Method.GET) {
			return countUsers()
		} else {
			return routeIfSecure(request, secureUsersRouter)
		}
	}

	async function countUsers(): Promise<ApiResponse> {
		return {
			status: 200,
			body: selectAllClients(serverStore.getState()).length,
		}
	}

	async function secureUsersRouter(
		request: SecureApiRequest
	): Promise<ApiResponse> {
		const pathUid = getUidFromPath(request)

		if (request.callerUid === pathUid) {
			return secureUsersUidRouter({
				...request,
				pathUid,
			})
		} else {
			return pathUidMismatchResponse
		}
	}

	async function secureUsersUidRouter(
		request: SecureUsersApiRequest
	): Promise<ApiResponse> {
		if (request.method === Method.GET) {
			return getUser(request)
		} else if (request.method === Method.PUT) {
			return validateBodyThenRoute(UserUpdate, putUser, request)
		}
		return defaultResponse
	}

	async function getUser(request: SecureUsersApiRequest): Promise<ApiResponse> {
		const user = await dbStore.users.getByUid(request.pathUid)

		if (user === null) {
			return {
				status: 404,
				body: {
					message: `userNotFound`,
				},
			}
		} else {
			return {
				status: 200,
				body: user,
			}
		}
	}

	async function putUser(
		request: SecureUsersApiRequest, user: UserUpdate
	): Promise<ApiResponse> {
		await dbStore.users.updateOrCreate(user, request.pathUid)

		return {status: 204}
	}
}

const usersUidPathRegEx = pathToRegexp('/users/:uid')

const pathUidMismatchResponse: ApiResponse = {
	status: 403,
	body: {
		message: 'not authorized to access this user',
	},
}

function getUidFromPath(request: ApiRequest) {
	const matches = usersUidPathRegEx.exec(request.path)
	return matches && matches[1]
}
