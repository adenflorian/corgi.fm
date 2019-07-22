import {Context} from 'koa'
import {Header} from '@corgifm/api-tester'
import {Next} from './server-types'
import {verifyAuthHeader} from './auth/server-auth'

export const secure = async (ctx: Context, next: Next) => {
	const authHeader = ctx.headers[Header.Authorization.toLowerCase()]

	if (!authHeader) {
		ctx.status = 401
		ctx.body = {
			message: `missing ${Header.Authorization} header`,
		}
		return
	}

	const {authenticated, emailVerified} = await verifyAuthHeader(authHeader)

	if (authenticated === true && emailVerified === true) {
		await next()
	} else if (authenticated !== true) {
		ctx.status = 401
		ctx.body = {
			message: 'invalid/expired token',
		}
	} else if (emailVerified !== true) {
		ctx.status = 403
		ctx.body = {
			message: 'not authorized',
		}
	} else {
		ctx.status = 401
		ctx.body = {
			message: 'not authenticated',
		}
	}
}
