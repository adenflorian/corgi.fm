import {
	RequestTest, path, get, put, ContentTypes,
} from '@corgifm/api-tester'
import {
	apiRouteNotFound, VerifyAuthHeaderMock, putValidationTests,
} from './api-test-common'

export function getUserApiTests(
	verifyAuthHeaderMock: VerifyAuthHeaderMock
): RequestTest[] {
	return [
		path('count', countTests()),
		path('unknownUserId', unknownUserIdTests()),
		path('', emptyPathTests()),
	]

	function emptyPathTests(): RequestTest[] {
		return [
			get({
				status: 404,
				contentType: ContentTypes.ApplicationJson,
				resBody: apiRouteNotFound,
			}),
			put({
				status: 404,
				contentType: ContentTypes.ApplicationJson,
				resBody: apiRouteNotFound,
				request: {body: {}},
			}),
		]
	}

	function countTests(): RequestTest[] {
		return [
			get({
				status: 200,
				contentType: ContentTypes.ApplicationJson,
				resBody: 0,
			}),
		]
	}

	function unknownUserIdTests(): RequestTest[] {
		return [
			put({
				name: 'missing Authorization header',
				request: emptyObjectBodyRequest,
				authorized: false,
				status: 401,
				contentType: ContentTypes.ApplicationJson,
				resBody: /missing Authorization header/,
			}),
			put({
				name: 'invalid Authorization header',
				request: fakeTokenRequest,
				authorized: false,
				status: 401,
				contentType: ContentTypes.ApplicationJson,
				resBody: /invalid\/expired token/,
			}),
			put({
				name: 'email not verified',
				before: emailNotVerified(verifyAuthHeaderMock),
				request: validTokenUnverifiedEmailRequest,
				authorized: false,
				status: 403,
				contentType: ContentTypes.ApplicationJson,
				resBody: /not authorized/,
			}),
			get({
				status: 404,
				contentType: ContentTypes.ApplicationJson,
				resBody: userNotFound,
			}),
			...putValidationTests('displayName', [{
				name: 'invalid display name type',
				body: {displayName: ['a', 'a', 'a', 'a', 'a,']},
				constraints: displayNameMustBeBetween1And42,
			}, {
				name: 'too short display name',
				body: {displayName: ''},
				constraints: displayNameMustGte1,
			}]),
		]
	}
}

const userNotFound = {
	message: `userNotFound`,
} as const

const displayNameMustBeBetween1And42 = {
	length: 'displayName must be longer than or equal to 1 '
		+ 'and shorter than or equal to 42 characters',
}

const displayNameMustGte1 = {
	length: 'displayName must be longer than or equal to 1 characters',
}

const fakeTokenRequest = {
	headers: {
		Authorization: 'Bearer fake-token',
	},
	body: {},
}

const validTokenUnverifiedEmailRequest = {
	headers: {
		Authorization: 'Bearer valid-token-but-email-not-verified',
	},
	body: {},
}

const emptyObjectBodyRequest = {body: {}}

function emailNotVerified(verifyAuthHeaderMock: VerifyAuthHeaderMock) {
	return () => verifyAuthHeaderMock.mockResolvedValue({
		authenticated: true,
		emailVerified: false,
	})
}
