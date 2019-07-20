import * as supertest from 'supertest'
import {oneLine} from 'common-tags'
import chalk from 'chalk'
import * as Koa from 'koa'

export enum ContentTypes {
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
	}
}

interface TestRequest {
	readonly name?: string
	readonly headers?: HeadersAssert
	readonly status: Status
	readonly contentType: ContentTypes
	readonly resBody: number | object | RegExp
	readonly log?: boolean
	readonly request?: {
		readonly contentType: ContentTypes
		readonly body: object
	}
}

enum Header {
	AccessControlAllowOrigin = 'Access-Control-Allow-Origin',
	ContentType = 'Content-Type',
	Origin = 'Origin',
}

type HeadersAssert = {
	[P in Header]?: RegExp | string
}

type RequiredField<T, K extends keyof T> = {
	[P in K]-?: T[P];
} & T

interface PutRequest extends RequiredField<TestRequest, 'request'> {}

type RequestTest = (getApp: GetApp, path: string) => void

type GetApp = () => Koa

export function testApi(getApp: GetApp, requests: RequestTest[]) {
	requests.forEach(invokeRequest(getApp))
}

function invokeRequest(getApp: GetApp, path1 = '') {
	return (test2: RequestTest) => {
		test2(getApp, path1)
	}
}

export function path(pathLeaf: string, requests: RequestTest[]): RequestTest {
	return (getApp: GetApp, pathTrunk: string) => {
		requests.forEach(invokeRequest(getApp, pathTrunk + '/' + pathLeaf))
	}
}

/** GET */
export function get(args: TestRequest): RequestTest {
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
export function put(args: PutRequest): RequestTest {
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
export function del(args: TestRequest): RequestTest {
	return (getApp: GetApp, finalPath: string) => {
		request({
			...args,
			method: Method.DELETE,
			finalPath,
			getApp,
		})
	}
}

type FinalRequest = TestRequest & {
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

	it(testName, done => doTest(args, testName, done))
}

function doTest(
	args: FinalRequest, testName: string, done: jest.DoneCallback
) {
	const {
		getApp, contentType, resBody, status, finalPath, method, log, headers,
	} = args

	let theTest = callHttpMethod(supertest(getApp().listen()), method, finalPath)

	theTest = theTest.set(Header.Origin, 'localhost')

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
			if (log) {
				console.log({
					testName,
					response: {
						status: res.status,
						headers: res.header,
						body: res.body,
					},
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
	}
}
