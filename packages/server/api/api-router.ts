import {Context} from 'koa'
import {ServerStore} from '../server-redux-types'
import {DBStore} from '../database/database'
import {CorgiMethodNotAllowedError} from '../api-error'
import {
	isSupportedMethod, ApiRequest, ApiResponse, defaultResponse,
} from './api-types'
import {getUsersRouter} from './users-controller'

export function apiRouter(serverStore: ServerStore, dbStore: DBStore) {
	const usersRouter = getUsersRouter(serverStore, dbStore)

	return async (ctx: Context) => {
		const request = createApiRequestFromContext(ctx)

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
}

function createApiRequestFromContext(ctx: Context): ApiRequest {
	if (!isSupportedMethod(ctx.method)) {
		throw new CorgiMethodNotAllowedError()
	}

	if (!ctx.path.startsWith('/api/')) {
		throw new Error(`this shouldn't happen`)
	}

	return {
		method: ctx.method,
		path: ctx.path.replace(/^\/api/, ''),
		headers: ctx.headers,
		body: ctx.request.body,
	}
}
