import {RequestTest, put, ContentTypes} from '@corgifm/api-tester'
import * as serverAuth from '../auth/server-auth'

export const apiRouteNotFound = /couldn't find an api route/

export type VerifyAuthHeaderMock =
	jest.Mock<ReturnType<typeof serverAuth.verifyAuthHeader>>

export interface ValidationTest {
	name: string
	body: {[key: string]: any}
	constraints: object
	log?: boolean
}

/** Reduces boilerplate for writing validation tests */
export function putValidationTests(
	property: string,
	tests: ValidationTest[]
) {
	// eslint-disable-next-line @typescript-eslint/promise-function-async
	return tests.map((t): RequestTest => {
		return put({
			name: t.name,
			contentType: ContentTypes.ApplicationJson,
			resBody: {
				validationError: [
					{
						value: t.body[property],
						property,
						children: [],
						constraints: t.constraints,
					},
				],
			},
			status: 400,
			request: {
				body: t.body,
			},
			log: t.log || false,
		})
	})
}

export const uidA = 'uidA567890123456789012345678'
export const uidB = 'uidB567890123456789012345678'
export const uidZ = 'uidZ567890123456789012345678'

export function emailNotVerifiedUidB(
	verifyAuthHeaderMock: VerifyAuthHeaderMock
) {
	return () => verifyAuthHeaderMock.mockResolvedValue({
		authenticated: true,
		emailVerified: false,
		uid: uidB,
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

export const validTokenUnverifiedEmailUidBRequest = {
	headers: {
		Authorization: 'Bearer valid-token-but-email-not-verified-uidB',
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
