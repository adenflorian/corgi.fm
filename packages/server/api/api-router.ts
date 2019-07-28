import {RequestHandler, Request} from 'express'
import {ServerStore} from '../server-redux-types'
import {DBStore} from '../database/database'
import {CorgiMethodNotAllowedError} from '../api-error'
import {
	isSupportedMethod, ApiRequest, ApiResponse, defaultResponse,
} from './api-types'
import {getUsersRouter} from './users-controller'

export function apiRouter(serverStore: ServerStore, dbStore: DBStore): RequestHandler {
	const usersRouter = getUsersRouter(serverStore, dbStore)

	return async (req, res, next) => {
		try {
			const request = createApiRequestFromContext(req)

			const response: ApiResponse = await topRouter(request)

			if (response.status === 204) {
				return res.sendStatus(response.status)
			} else {
				return res.status(response.status).json(response.body)
			}
		} catch (error) {
			return next(error)
		}
	}

	async function topRouter(request: ApiRequest): Promise<ApiResponse> {
		if (request.path.startsWith('/users/')) {
			return usersRouter(request)
		} else {
			return defaultResponse
		}
	}
}

function createApiRequestFromContext(req: Request): ApiRequest {
	if (!isSupportedMethod(req.method)) {
		throw new CorgiMethodNotAllowedError()
	}

	return {
		method: req.method,
		path: req.path,
		headers: req.headers,
		body: req.body,
	}
}
