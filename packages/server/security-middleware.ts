import {Context} from 'koa'
import {Header} from '@corgifm/api-tester'
import {Next} from './server-types'
import {verifyAuthHeader} from './auth/server-auth'

/** Middleware that asserts there is an Authorization header containing
 * a valid, signed, and not expired, JWT for an email verified user. */
export const requireEmailVerifiedUser = async (ctx: Context, next: Next) => {
	const authHeader = ctx.headers[Header.Authorization.toLowerCase()]

	if (!authHeader) {
		ctx.status = 401
		ctx.body = {
			message: `missing ${Header.Authorization} header`,
		}
		return
	}

	const {authenticated, emailVerified, uid} = await verifyAuthHeader(authHeader)

	if (authenticated === true && emailVerified === true) {
		ctx.state.authenticatedCaller = {
			uid,
		}
		await next()
	} else if (authenticated !== true) {
		ctx.status = 401
		ctx.body = {
			message: 'invalid/expired token',
		}
	} else if (emailVerified !== true) {
		ctx.status = 403
		ctx.body = {
			message: 'not authorized A',
		}
	} else {
		ctx.status = 401
		ctx.body = {
			message: 'not authenticated',
		}
	}
}

/**
 * Middleware that asserts that uid in params matches uid of authorized caller
 */
export const checkUid = async (ctx: Context, next: Next) => {
	const callerUid = ctx.state.authenticatedCaller.uid
	const pathUid = ctx.params.uid

	if (callerUid !== pathUid) {
		ctx.status = 403
		ctx.body = {
			message: 'not authorized B',
		}
		return
	} else {
		await next()
	}
}
