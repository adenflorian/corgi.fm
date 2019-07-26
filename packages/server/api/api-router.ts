import {Context} from 'koa'
import * as pathToRegexp from 'path-to-regexp'
import {logger} from '@corgifm/common/logger'
import {selectAllClients} from '@corgifm/common/redux'
import {UserUpdate} from '@corgifm/common/models/User'
import {Next} from '../server-types'
import {ServerStore} from '../server-redux-types'
import {DBStore} from '../database/database'
import {routeIfSecure} from '../security-middleware'
import {validateBodyThenRoute} from '../server-validation'
import {
	isSupportedMethod, ApiRequest, ApiResponse, Method,
	SecureApiRequest,
	SecureUsersApiRequest,
} from './api-types'

export function apiRouter(serverStore: ServerStore, dbStore: DBStore) {
	return async (ctx: Context, next: Next) => {
		logger.log('Hello API!')

		if (!isSupportedMethod(ctx.method)) {
			return ctx.status = 405
		}

		if (!ctx.path.startsWith('/api/')) {
			throw new Error(`this shouldn't happen`)
		}

		const request: ApiRequest = {
			method: ctx.method,
			path: ctx.path.replace(/^\/api/, ''),
			headers: ctx.headers,
			body: ctx.request.body,
		}

		logger.log('Hello from the API router!', {request})

		const response: ApiResponse = await topRouter(request)

		ctx.status = response.status
		if (response.status !== 204) {
			ctx.body = response.body
		}
		return
	}

	async function topRouter(request: ApiRequest): Promise<ApiResponse> {
		if (request.path.startsWith('/users/')) {
			return usersRouter(request)
		} else {
			return defaultResponse
		}
	}

	async function usersRouter(request: ApiRequest): Promise<ApiResponse> {
		if (request.path === '/users/count' && request.method === Method.GET) {
			return {
				status: 200,
				body: selectAllClients(serverStore.getState()).length,
			}
		} else {
			return routeIfSecure(request, secureUsersRouter)
		}
	}

	async function secureUsersRouter(
		request: SecureApiRequest
	): Promise<ApiResponse> {
		// assert path matches /users/:uid
		const matches = usersUidPathRegEx.exec(request.path)
		if (!matches) return pathUidMismatchResponse

		// extract uid from path
		const callerUid = request.callerUid
		const pathUid = matches[1]
		logger.log('secureUsersRouter:', {callerUid, pathUid, matches})

		if (callerUid !== pathUid) {
			return pathUidMismatchResponse
		} else {
			return secureUsersUidRouter({
				...request,
				pathUid,
			})
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

		return {
			status: 204,
		}
	}
}

const usersUidPathRegEx = pathToRegexp('/users/:uid')

const defaultResponse: ApiResponse = {
	status: 404,
	body: {
		message: `couldn't find an api route`,
	},
}

const pathUidMismatchResponse: ApiResponse = {
	status: 403,
	body: {
		message: 'not authorized to access this user',
	},
}
