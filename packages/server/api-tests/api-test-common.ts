import {RequestTest, put, ContentTypes} from '@corgifm/api-tester'
import * as serverAuth from '../auth/server-auth'

export const apiRouteNotFoundResponse = /couldn't find an api route/

export const missingAuthHeaderResponse = /missing authorization header/

export type VerifyAuthHeaderMock =
	jest.Mock<ReturnType<typeof serverAuth.verifyAuthHeader>>

export interface ValidationTest<TModel> {
	name: string
	body: TModel
	constraints: {[K in keyof TModel]: object}
	log?: boolean
}

/** Reduces boilerplate for writing validation tests */
export function putValidationTests
<TModel extends object>(
	tests: ValidationTest<TModel>[]
) {
	return tests.map((t): RequestTest => {
		return put<TModel, {}>({
			name: t.name,
			contentType: ContentTypes.ApplicationJson,
			resBody: {
				validationError: Object.keys(t.body).map(property => {
					return {
						// // @ts-ignore
						// value: t.body[property],
						property,
						children: [],
						// @ts-ignore
						constraints: t.constraints[property],
					}
				}),
			},
			status: 400,
			request: {
				body: t.body,
			},
			log: t.log || false,
		})
	})
}

/** Default test uid for api tests */
export const uidA = 'uidA567890123456789012345678'
export const uidB = 'uidB567890123456789012345678'
export const uidZ = 'uidZ567890123456789012345678'

export function emailNotVerifiedUidA(
	verifyAuthHeaderMock: VerifyAuthHeaderMock
) {
	return () => verifyAuthHeaderMock.mockResolvedValue({
		authenticated: true,
		emailVerified: false,
		uid: uidA,
	})
}

export function emailVerifiedUidA(
	verifyAuthHeaderMock: VerifyAuthHeaderMock
) {
	return () => verifyAuthHeaderMock.mockResolvedValue({
		authenticated: true,
		emailVerified: true,
		uid: uidA,
	})
}

export const fakeTokenRequest = {
	headers: {
		Authorization: 'Bearer fake-token',
	},
	body: {},
}

export const validTokenUnverifiedEmailUidARequest = {
	headers: {
		Authorization: 'Bearer valid-token-but-email-not-verified-uidA',
	},
	body: {},
}

export const validTokenVerifiedEmailUidARequest = {
	headers: {
		Authorization: 'Bearer valid-token-but-email-not-verified-uidA',
	},
	body: {},
}

export const emptyObjectBodyRequest = {body: {}}
