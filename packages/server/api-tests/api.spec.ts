import {configureServerStore} from '@corgifm/common/redux'
import {testApi, path, get, del, ContentTypes, put} from '@corgifm/api-tester'
import {logger} from '@corgifm/common/logger'
import * as Koa from 'koa'
import {connectDB, DBStore} from '../database/database'
import {setupExpressApp} from '../setup-express-app'

const userNotFound = {
	message: `userNotFound`,
} as const

describe('API Tests', () => {
	let db: DBStore
	let app: Koa
	const getApp = () => app

	beforeAll(async () => {
		logger.disable()
		db = await connectDB()
		app = await setupExpressApp(configureServerStore(), db)
	})

	afterAll(async () => {
		await db.close()
		logger.enable()
	})

	describe('tests', () => {
		testApi(getApp, [
			path('error', [
				get({
					name: 'should handle errors',
					status: 500,
					contentType: ContentTypes.ApplicationJson,
					resBody: /something borked.*useful: [0-9a-z]{32}/,
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
					name: 'should serve index.html by default for GET',
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
					resBody: /<title>corgi\.fm<\/title>/,
					headers: {
						'Access-Control-Allow-Origin': '*',
					},
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
							request: {
								body: {
									displayName: '',
								},
								contentType: ContentTypes.ApplicationJson,
							},
							status: 501,
							contentType: ContentTypes.ApplicationJson,
							resBody: {
								message: `userNotFound`,
							},
						}),
					]),
				]),
			]),
		])
	})
})
