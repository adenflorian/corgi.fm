import {Server} from 'http'
import {configureServerStore} from '@corgifm/common/redux'
import {testApi, path, get, del, ContentTypes, put} from '@corgifm/api-tester'
import {logger} from '@corgifm/common/logger'
import {connectDB, DBStore} from '../database/database'
import {setupExpressApp} from '../setup-express-app'

const userNotFound = {
	message: `userNotFound`,
} as const

const apiRouteNotFound = /couldn't find an api route/

describe('API Tests', () => {
	let db: DBStore
	let app: Server
	const getApp = () => app

	beforeAll(async () => {
		db = await connectDB()
		app = (await setupExpressApp(configureServerStore(), db)).listen()
	})

	afterAll(async () => {
		app.close()
		await db.close()
	})

	describe('tests', () => {
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
				path('users', [
					path('count', [
						get({
							status: 200,
							contentType: ContentTypes.ApplicationJson,
							resBody: 0,
						}),
					]),
					path('unknownUserId', [
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
											length: 'displayName must be longer than or equal to 1 and shorter than or equal to 42 characters',
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
											length: 'displayName must be longer than or equal to 1 characters',
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
				]),
			]),
		])
	})
})
