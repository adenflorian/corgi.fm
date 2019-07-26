import {logger} from '@corgifm/common/logger'
import {Context} from 'koa'
import {selectAllClients} from '@corgifm/common/redux'
import {Next} from '../server-types'
import {ServerStore} from '../server-redux-types'
import {DBStore} from '../database/database'

enum Method {
	GET = 'GET',
	PUT = 'PUT',
}

export function apiRouter(serverStore: ServerStore, dbStore: DBStore) {
	return async (ctx: Context, next: Next) => {
		logger.log('Hello API!')

		if (!isSupportedMethod(ctx.method)) {
			return ctx.status = 405
		}

		if (!ctx.path.startsWith('/api/')) {
			throw new Error(`this shouldn't happen`)
		}

		const method: Method = ctx.method
		const path = ctx.path.replace(/^\/api/, '')

		logger.log('Hello API!', {method, path})

		if (path === '/users/count' && method === Method.GET) {
			ctx.status = 200
			ctx.body = selectAllClients(serverStore.getState()).length
			return
		}

		ctx.status = 404
		ctx.body = {
			message: `couldn't find an api route`,
		}
		return
	}
}

function isSupportedMethod(method: string): method is Method {
	return method in Method
}
