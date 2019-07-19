import {Application} from 'express'
import * as supertest from 'supertest'
import {configureServerStore} from '@corgifm/common/redux'
import {logger} from '@corgifm/common/logger'
import {RequiredField} from '@corgifm/common/common-types'
import chalk from 'chalk'
import {oneLine} from 'common-tags'
import {connectDB, DBStore} from '../database/database'
import {setupExpressApp} from '../setup-express-app'

enum ContentTypes {
	ApplicationJson = 'application/json',
	TextHtml = 'text/html'
}

enum Method {
	GET = 'GET',
	PUT = 'PUT',
	DELETE = 'DELETE',
}

type Status = 200 | 201 | 204 | 404 | 500 | 501

function ContentTypeRegEx(type: ContentTypes): RegExp {
	switch (type) {
		case ContentTypes.ApplicationJson: return /application\/json/
		case ContentTypes.TextHtml: return /text\/html/
		default: throw new Error('oops e daisy')
	}
}

const userNotFound = {
	message: `userNotFound`,
} as const

describe('API Tests', () => {
	let db: DBStore
	let app: Application
	const getApp = () => app

	beforeAll(async () => {
		db = await connectDB()
		app = await setupExpressApp(configureServerStore(), db)
	})

	afterAll(async () => {
		await db.close()
	})

	it('should use CORS', async () => {
		await supertest(app)
			.get('/')
			.expect('Access-Control-Allow-Origin', '*')
	})

	describe('tests', () => {
		testApi(getApp, [
			path('error', [
				get({
					name: 'should handle errors',
					status: 500,
					contentType: ContentTypes.ApplicationJson,
					resBody: /something borked.*useful: [0-9a-z]{32}/,
					disableConsole: true,
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

interface Request {
	readonly name?: string
	readonly headers?: HeadersAssert
	readonly status: Status
	readonly contentType: ContentTypes
	readonly resBody: number | object | RegExp
	readonly log?: boolean
	readonly disableConsole?: boolean
	readonly request?: {
		readonly contentType: ContentTypes
		readonly body: object
	}
}

enum Header {
	AccessControlAllowOrigin = 'Access-Control-Allow-Origin',
	ContentType = 'Content-Type',
}

type HeadersAssert = {
	[P in Header]?: RegExp | string
}

interface PutRequest extends RequiredField<Request, 'request'> {}

type RequestTest = (getApp: GetApp, path: string) => void

type GetApp = () => Application

function testApi(getApp: GetApp, requests: RequestTest[]) {
	requests.forEach(invokeRequest(getApp))
}

function invokeRequest(getApp: GetApp, path1 = '') {
	return (test2: RequestTest) => {
		test2(getApp, path1)
	}
}

function path(pathLeaf: string, requests: RequestTest[]): RequestTest {
	return (getApp: GetApp, pathTrunk: string) => {
		requests.forEach(invokeRequest(getApp, pathTrunk + '/' + pathLeaf))
	}
}

/** GET */
function get(args: Request): RequestTest {
	return (getApp: GetApp, finalPath: string) => {
		request({
			...args,
			method: Method.GET,
			finalPath,
			getApp,
		})
	}
}

/** PUT */
function put(args: PutRequest): RequestTest {
	return (getApp: GetApp, finalPath: string) => {
		request({
			...args,
			method: Method.PUT,
			finalPath,
			getApp,
		})
	}
}

/** DELETE */
function del(args: Request): RequestTest {
	return (getApp: GetApp, finalPath: string) => {
		request({
			...args,
			method: Method.DELETE,
			finalPath,
			getApp,
		})
	}
}

type FinalRequest = Request & {
	method: Method
	finalPath: string
	getApp: GetApp
}

function request(args: FinalRequest): void {
	const {name = '', method, finalPath, status} = args

	const testName = oneLine`
		${chalk.magentaBright(method)}
		${finalPath}
		${chalk.magenta(status.toString())}
		${chalk.blue(name)}
	`.trim()

	it(testName, done => 	doTest(args, testName, done))
}

function doTest(
	args: FinalRequest, testName: string, done: jest.DoneCallback
) {
	const {
		getApp, contentType, resBody, status, finalPath, method, log, headers,
	} = args

	if (args.disableConsole) logger.disable()

	let theTest = callHttpMethod(supertest(getApp()), method, finalPath)

	if (args.request) {
		theTest = theTest.send(args.request.body)
			.set(Header.ContentType, args.request.contentType)
	}

	theTest = theTest.expect(status)

	if (contentType) {
		theTest = theTest.expect(
			Header.ContentType, ContentTypeRegEx(args.contentType))
	}

	if (headers) {
		Object.keys(headers).forEach(name => {
			const value = headers[name as Header]!
			// @ts-ignore
			theTest = theTest.expect(name, value)
		})
	}

	if (resBody) {
		theTest = theTest.expect(resBody)
	}

	// eslint-disable-next-line @typescript-eslint/no-floating-promises
	theTest
		.end(async (err, res) => {
			logger.enable()
			if (log) {
				logger.log({
					testName,
					responseHeaders: res.header,
					responseBody: res.body,
				})
			}
			if (err) {
				done(err)
			}
			done()
		})
}

// eslint-disable-next-line @typescript-eslint/promise-function-async
function callHttpMethod(
	st: supertest.SuperTest<supertest.Test>, method: Method, url: string
) {
	switch (method) {
		case Method.GET: return st.get(url)
		case Method.PUT: return st.put(url)
		case Method.DELETE: return st.delete(url)
		default: throw new Error(`bad callHttpMethod: ${method}`)
	}
}
