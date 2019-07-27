import {Context} from 'koa'
import {Header} from '@corgifm/common/common-types'
import {Next} from './server-types'
import {verifyAuthHeader} from './auth/server-auth'
import {
	ApiRequest, ApiResponse, SecureRouter,
} from './api/api-types'

/** Asserts there is an Authorization header containing
 * a valid, signed, and not expired, JWT for an email verified user. */
export async function routeIfSecure(
	request: ApiRequest, secureRouter: SecureRouter
): Promise<ApiResponse> {
	const authHeader = request.headers.authorization

	if (!authHeader) {
		return {
			status: 401,
			body: {
				message: `missing ${Header.Authorization} header`,
			},
		}
	}

	const {authenticated, emailVerified, uid} = await verifyAuthHeader(authHeader)

	if (authenticated === true && emailVerified === true) {
		return secureRouter({
			...request,
			callerUid: uid,
		})
	} else if (authenticated !== true) {
		return {
			status: 401,
			body: {
				message: 'invalid/expired token',
			},
		}
	} else if (emailVerified !== true) {
		return {
			status: 403,
			body: {
				message: 'not authorized A',
			},
		}
	} else {
		return {
			status: 401,
			body: {
				message: 'not authenticated',
			},
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
