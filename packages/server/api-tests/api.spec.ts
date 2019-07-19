import {Application} from 'express'
import * as supertest from 'supertest'
import {configureServerStore} from '@corgifm/common/redux'
import {connectDB, DBStore} from '../database/database'
import {setupExpressApp} from '../setup-express-app'

const ContentType = 'content-type'

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

// const noRoute = {
// 	message: `couldn't find a route matching PUT /api/users/unknownUserId`,
// } as const

const userNotFound = {
	message: `userNotFound`,
} as const

describe('API Tests', () => {
	let db: DBStore
	let app: Application
	const getApp = () => app

	beforeEach(async () => {
		db = await connectDB()
		app = await setupExpressApp(configureServerStore(), db)
	})

	afterEach(async () => {
		await db.close()
	})

	describe('tests', () => {
		testApi(getApp, [
			path('newsletter', [
				get({
					status: 200,
					contentType: ContentTypes.TextHtml,
					resBody: {},
				}),
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
	readonly status: Status
	readonly contentType: ContentTypes
	readonly resBody: number | object
}

interface PutRequest extends Request {
	readonly request: {
		readonly contentType: ContentTypes
		readonly body: object
	}
}

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

type FinalRequest = Request & Partial<PutRequest> & {
	method: Method
	finalPath: string
	getApp: GetApp
}

function request(args: FinalRequest): void {
	const {method, finalPath} = args
	const testName = `${method} ${finalPath}`

	it(testName, done => doTest(args, testName, done))
}

function doTest(args: FinalRequest, testName: string, done: jest.DoneCallback) {
	const {getApp, contentType, resBody, status, finalPath, method} = args

	let theTest = callHttpMethod(supertest(getApp()), method, finalPath)

	if (args.request) {
		theTest = theTest.send(args.request.body)
			.set(ContentType, args.request.contentType)
	}

	theTest = theTest.expect(status)

	if (contentType) {
		theTest = theTest.expect(
			ContentType, ContentTypeRegEx(args.contentType))
	}

	if (resBody) {
		theTest = theTest.expect(resBody)
	}

	// eslint-disable-next-line @typescript-eslint/no-floating-promises
	theTest
		.end(async (err, res) => {
			if (err) {
				// logger.error({
				// 	testName,
				// 	responseHeaders: res.header,
				// 	responseBody: res.body,
				// })
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
