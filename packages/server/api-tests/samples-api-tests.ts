import {
	RequestTest, path, get, put, ContentTypes, post,
} from '@corgifm/api-tester'
import {DBStore} from '../database/database'
import {
	VerifyAuthHeaderMock, missingAuthHeaderResponse, apiRouteNotFoundResponse,
} from './api-test-common'

export function getSampleApiTests(
	getDb: () => DBStore,
	verifyAuthHeaderMock: VerifyAuthHeaderMock,
): RequestTest[] {

	return [
		path('', emptyPathTests()),
	]

	function emptyPathTests(): RequestTest[] {
		return [
			get({
				status: 401,
				authorized: false,
				contentType: ContentTypes.ApplicationJson,
				resBody: missingAuthHeaderResponse,
			}),
			put({
				status: 401,
				authorized: false,
				contentType: ContentTypes.ApplicationJson,
				resBody: missingAuthHeaderResponse,
				request: {body: {}},
			}),
			post({
				status: 401,
				authorized: false,
				contentType: ContentTypes.ApplicationJson,
				resBody: missingAuthHeaderResponse,
				request: {body: {}},
			}),
			get({
				status: 404,
				contentType: ContentTypes.ApplicationJson,
				resBody: apiRouteNotFoundResponse,
			}),
			// TODO
			post({
				status: 500,
				contentType: ContentTypes.ApplicationJson,
				resBody: /something borked/,
				request: {body: {}},
			}),
			// TODO File too big
			// TODO Upload success
		]
	}
}
