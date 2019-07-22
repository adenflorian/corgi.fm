import {RequestTest, path, get, put, ContentTypes} from '@corgifm/api-tester'
import {apiRouteNotFound, VerifyAuthHeaderMock} from './api-test-common'

const userNotFound = {
	message: `userNotFound`,
} as const

export function getUserApiTests(
	verifyAuthHeaderMock: VerifyAuthHeaderMock
): RequestTest[] {
	return [
		path('count', [
			get({
				status: 200,
				contentType: ContentTypes.ApplicationJson,
				resBody: 0,
			}),
		]),
		path('unknownUserId', [
			put({
				name: 'missing Authorization header',
				authorized: false,
				status: 401,
				contentType: ContentTypes.ApplicationJson,
				resBody: /missing Authorization header/,
				request: {body: {}},
			}),
			put({
				name: 'invalid Authorization header',
				authorized: false,
				status: 401,
				contentType: ContentTypes.ApplicationJson,
				resBody: /invalid\/expired token/,
				request: {
					headers: {
						Authorization: 'Bearer fake-token',
					},
					body: {},
				},
			}),
			put({
				name: 'email not verified',
				authorized: false,
				before: () => verifyAuthHeaderMock.mockResolvedValue({
					authenticated: true,
					emailVerified: false,
				}),
				status: 403,
				contentType: ContentTypes.ApplicationJson,
				resBody: /not authorized/,
				request: {
					headers: {
						Authorization: 'Bearer valid-token-but-email-not-verified',
					},
					body: {},
				},
			}),
			get({
				status: 404,
				contentType: ContentTypes.ApplicationJson,
				resBody: userNotFound,
			}),
			put({
				name: 'invalid display name type',
				request: {
					body: {displayName: ['a', 'a', 'a', 'a', 'a,']},
				},
				status: 400,
				contentType: ContentTypes.ApplicationJson,
				resBody: {
					validationError: [
						{
							value: ['a', 'a', 'a', 'a', 'a,'],
							property: 'displayName',
							children: [],
							constraints: {
								length: 'displayName must be longer than or equal to 1 '
									+ 'and shorter than or equal to 42 characters',
							},
						},
					],
				},
			}),
			put({
				name: 'too short display name',
				request: {
					body: {displayName: ''},
				},
				status: 400,
				contentType: ContentTypes.ApplicationJson,
				resBody: {
					validationError: [
						{
							value: '',
							property: 'displayName',
							children: [],
							constraints: {
								length: 'displayName must be longer than or equal to 1 '
									+ 'characters',
							},
						},
					],
				},
			}),
		]),
		path('', [
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
		]),
	]
}
