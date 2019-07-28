import {Header} from '@corgifm/common/common-types'
import {verifyAuthHeader} from './auth/server-auth'
import {
	ApiRequest, ApiResponse, SecureRouter,
} from './api/api-types'

/** Asserts there is an Authorization header containing
 * a valid, signed, and not expired, JWT. */
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

	if (authenticated === true) {
		return secureRouter({
			...request,
			callerUid: uid,
			emailVerified,
		})
	} else {
		return {
			status: 401,
			body: {
				message: 'invalid/expired token',
			},
		}
	}
}
