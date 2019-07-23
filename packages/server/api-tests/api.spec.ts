import {Server} from 'http'
import {configureServerStore} from '@corgifm/common/redux'
import {testApi, path, get, del, ContentTypes} from '@corgifm/api-tester'
import {logger} from '@corgifm/common/logger'
import {connectDB, DBStore} from '../database/database'
import {setupExpressApp} from '../setup-express-app'
import * as serverAuth from '../auth/server-auth'
import {
	apiRouteNotFound, emailVerifiedUidA, validTokenVerifiedEmailUidARequest,
} from './api-test-common'
import {getUserApiTests} from './users-api-tests'

jest.mock('../auth/server-auth')

const verifyAuthHeaderMock =
	serverAuth.verifyAuthHeader as
	unknown as
	jest.Mock<ReturnType<typeof serverAuth.verifyAuthHeader>>

mockAuthToFail()

function mockAuthToFail() {
	verifyAuthHeaderMock.mockResolvedValue({
		authenticated: false,
		emailVerified: false,
		uid: '',
	})
}

describe('API Tests', () => {
	let db: DBStore
	let app: Server
	const getApp = () => app
	const getDb = () => db

	beforeAll(async () => {
		db = await connectDB()
		app = (await setupExpressApp(configureServerStore(), db)).listen()
	})

	afterEach(() => {
		mockAuthToFail()
	})

	afterAll(async () => {
		app.close()
		await db.close()
	})

	describe('tests', () => {
		/**
		 * Requests are authorized by default.
		 * Authorized requests have an Authorization header with a valid JWT
		 * containing a payload with a uid of `uidA` and a verified email.
		 * Currently the `verifyAuthHeader` function is mocked out for these tests.
		 * By default, it returns data saying that the caller is authenticated,
		 * email verified, with a uid of uidA.
		 */
		testApi(getApp, [
			path('error', [
				get({
					name: 'should handle errors',
					status: 500,
					contentType: ContentTypes.ApplicationJson,
					resBody: /something borked.*useful: [0-9a-z]{32}/,
					before: logger.disable,
					after: logger.enable,
				}),
			]),
			path('fake-path', [
				del({
					name: 'should 404 when no matching route',
					status: 404,
					contentType: ContentTypes.ApplicationJson,
					resBody: /couldn't find a route/,
				}),
				get({
					name: 'should default to index.html',
					status: 200,
					contentType: ContentTypes.TextHtml,
					resBody: /<title>corgi\.fm<\/title>/,
				}),
			]),
			path('', [
				get({
					name: 'should use CORS',
					status: 200,
					contentType: ContentTypes.TextHtml,
					resBody: /.*/,
					headers: {
						'Access-Control-Allow-Origin': '*',
					},
				}),
			]),
			path(['', 'index.html'], [
				get({
					name: 'should serve index.html',
					status: 200,
					contentType: ContentTypes.TextHtml,
					resBody: /<title>corgi\.fm<\/title>/,
				}),
			]),
			path('terms.html', [
				get({
					name: 'should serve static files',
					status: 200,
					contentType: ContentTypes.TextHtml,
					resBody: /Terms of Service/,
				}),
			]),
			path('newsletter', [
				get({
					status: 200,
					contentType: ContentTypes.TextHtml,
					resBody: /Begin Mailchimp Signup Form/,
				}),
			]),
			path('state', [
				get({
					status: 200,
					contentType: ContentTypes.ApplicationJson,
					resBody: {
						clients: {clients: []},
						rooms: {all: {}, activeRoom: ''},
						roomStores: {},
					},
				}),
				path('lobby', [
					get({
						status: 200,
						contentType: ContentTypes.ApplicationJson,
						resBody: {},
					}),
				]),
			]),
			path('api', [
				path(['', 'fake-api-path', 'fake/api/path'], [
					get({
						name: 'should 404 when no matching route',
						status: 404,
						contentType: ContentTypes.ApplicationJson,
						resBody: apiRouteNotFound,
					}),
				]),
				path('users', getUserApiTests(getDb, verifyAuthHeaderMock)),
			]),
		], {
			authorizedRequests: {
				before: emailVerifiedUidA(verifyAuthHeaderMock),
				request: validTokenVerifiedEmailUidARequest,
			},
		})
	})
})
