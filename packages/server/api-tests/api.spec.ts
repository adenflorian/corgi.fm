import {Application} from 'express'
import * as supertest from 'supertest'
import {configureServerStore} from '@corgifm/common/redux'
import {logger} from '@corgifm/common/logger'
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

function ContentTypeRegEx(type: ContentTypes): RegExp {
	switch (type) {
		case ContentTypes.ApplicationJson: return /application\/json/
		case ContentTypes.TextHtml: return /text\/html/
		default: throw new Error('oops e daisy')
	}
}

describe('API Tests', () => {
	let db: DBStore
	let app: Application

	beforeEach(async () => {
		db = await connectDB()
		app = await setupExpressApp(configureServerStore(), db)
	})

	afterEach(async () => {
		await db.close()
	})

	describe('tests', () => {
		testApi([
			path('newsletter', [
				get({
					status: 200,
					contentType: ContentTypes.TextHtml,
				}),
			]),
			path('api', [
				path('users', [
					path('count', [
						get({
							status: 200,
							contentType: ContentTypes.ApplicationJson,
						}),
					]),
					path('123', [
						get({
							status: 200,
							contentType: ContentTypes.ApplicationJson,
						}),
						put({
							status: 204,
						}),
					]),
				]),
			]),
		])

		interface Request {
			status: 200 | 204
			contentType?: ContentTypes
		}

		type RequestTest = (path: string) => void

		function testApi(requests: RequestTest[]) {
			requests.forEach(invokeRequest())
		}

		function invokeRequest(path1 = '') {
			return (test2: RequestTest) => {
				test2(path1)
			}
		}

		function path(pathLeaf: string, requests: RequestTest[]): RequestTest {
			return (pathTrunk: string) => {
				requests.forEach(invokeRequest(pathTrunk + '/' + pathLeaf))
			}
		}

		function get(args: Request): RequestTest {
			return (finalPath: string) => {
				request({
					...args,
					method: Method.GET,
					// eslint-disable-next-line @typescript-eslint/promise-function-async
					m: a => a.get(finalPath),
					finalPath,
				})
			}
		}

		function put(args: Request): RequestTest {
			return (finalPath: string) => {
				request({
					...args,
					method: Method.PUT,
					// eslint-disable-next-line @typescript-eslint/promise-function-async
					m: a => a.put(finalPath),
					finalPath,
				})
			}
		}

		interface FinalRequest extends Request {
			method: Method
			m: (a: supertest.SuperTest<supertest.Test>) => supertest.Test
			finalPath: string
		}

		function request(args: FinalRequest): void {
			const {method, finalPath, m} = args
			const testName = `${method} ${finalPath}`
			it(
				testName,
				async done => {
					// eslint-disable-next-line @typescript-eslint/no-floating-promises
					m(supertest(app))
						.expect(res => {
							expect(res.status).toEqual(args.status)
							if (args.contentType) {
								expect(res.header[ContentType])
									.toMatch(ContentTypeRegEx(args.contentType))
							}
						})
						.end(async (err, res) => {
							if (err) {
								logger.error({
									testName,
									responseHeaders: res.header,
								})
								done(err)
							}
							done()
						})
				}
			)
		}
	})
})
