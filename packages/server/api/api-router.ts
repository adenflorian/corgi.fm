import {RequestHandler, Request} from 'express'
import {ServerStore} from '../server-redux-types'
import {DBStore} from '../database/database'
import {CorgiMethodNotAllowedError} from '../api-error'
import {
	isSupportedMethod, ApiRequest, ApiResponse, defaultResponse,
} from './api-types'
import {getUsersController} from './users-controller'
import {getSamplesController} from './samples-controller';
import {Response} from 'express';

export function apiRouter(serverStore: ServerStore, dbStore: DBStore): RequestHandler {
	const usersController = getUsersController(serverStore, dbStore)
	const samplesController = getSamplesController(serverStore, dbStore)

	return async (req, res, next) => {
		try {
			const request = createApiRequestFromContext(req, res)

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
		if (pathMatches(request, 'users')) {
			return usersController({...request, truncatedPath: request.path.replace(/^\/users/, '')})
		} else if (pathMatches(request, 'samples')) {
			return samplesController({...request, truncatedPath: request.path.replace(/^\/samples/, '')})
		} else {
			return defaultResponse
		}
	}
}

function pathMatches(request: ApiRequest, route: string) {
	return request.path === `/${route}` || request.path.startsWith(`/${route}/`)
}

function createApiRequestFromContext(req: Request, res: Response): ApiRequest {
	if (!isSupportedMethod(req.method)) {
		throw new CorgiMethodNotAllowedError()
	}

	return {
		method: req.method,
		path: req.path,
		headers: req.headers,
		body: req.body,
		originalRequest: req,
		originalResponse: res,
	}
}
