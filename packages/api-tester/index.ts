/* eslint-disable no-param-reassign */
import * as supertest from 'supertest'
import {oneLine} from 'common-tags'
import chalk from 'chalk'
import {Application} from 'express'
import {ClassType} from 'class-transformer/ClassTransformer';
import {transformAndValidate, CorgiValidationError} from '@corgifm/common/validation';

export enum ContentTypes {
	ApplicationJson = 'application/json',
	TextHtml = 'text/html',
}

enum Method {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	DELETE = 'DELETE',
}

type Status = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 500 | 501

function ContentTypeRegEx(type: ContentTypes): RegExp {
	switch (type) {
		case ContentTypes.ApplicationJson: return /application\/json/
		case ContentTypes.TextHtml: return /text\/html/
	}
}

type TestRequest<TRequestModel = object, TResponseModel = object> = {
	readonly name?: string
	/** Defaults to true */
	readonly authorized?: boolean
	readonly headers?: HeadersAssert
	readonly log?: boolean
	readonly before?: () => any
	readonly after?: () => Promise<any>
	readonly request?: RequestArgs<TRequestModel>
} & ({
	readonly status: Exclude<Status, 204>
	readonly contentType: ContentTypes
	readonly resBody: TResponseModel | RegExp
	readonly validateResponseBodyModel?: ClassType<TResponseModel>
} | {
	readonly status: 204
	readonly contentType?: undefined
	readonly resBody?: undefined
	readonly validateResponseBodyModel?: undefined
})

interface RequestArgs<TModel = object> {
	readonly headers?: Headers
	/** Ignored when using upload */
	readonly contentType?: ContentTypes
	/** Ignored when using upload */
	readonly body?: TModel
	readonly upload?: {
		readonly fileField: string,
		readonly buffer: Buffer,
		readonly fileName: string,
		readonly fields?: {[fieldName: string]: string}
	}
}

export enum Header {
	AccessControlAllowOrigin = 'Access-Control-Allow-Origin',
	ContentType = 'Content-Type',
	Origin = 'Origin',
	Authorization = 'Authorization',
}

type Headers = {
	[P in Header]?: string
}

type HeadersAssert = {
	[P in keyof Headers]: RegExp | string
}

type RequiredField<T, K extends keyof T> = {
	[P in K]-?: T[P];
} & T

type PutRequest<TModel, TResponseModel> =
	RequiredField<TestRequest<TModel, TResponseModel>, 'request'>

export type RequestTest =
	(getApp: GetApp, path: string, options: TestApiOptions) => void

type GetApp = () => Application

interface TestApiOptions {
	/** Will be merged into authorized requests. Requests are authorized
	 * by default. */
	authorizedRequests: AuthorizedRequests
}

interface AuthorizedRequests extends Pick<TestRequest, 'before' | 'after'> {
	request: Partial<Pick<RequestArgs, 'headers'>>
}

export function testApi(
	getApp: GetApp, requests: RequestTest[], options: TestApiOptions
) {
	requests.forEach(invokeRequest(getApp, '', options))
}

function invokeRequest(
	getApp: GetApp, path1: string, options: TestApiOptions
) {
	return (test2: RequestTest) => {
		test2(getApp, path1, options)
	}
}

export function path(
	pathLeaf: string[] | string, requests: RequestTest[]
): RequestTest {
	const paths = typeof pathLeaf === 'string'
		? [pathLeaf]
		: pathLeaf
	return (getApp: GetApp, pathTrunk: string, options: TestApiOptions) => {
		requests.forEach(request => {
			paths.forEach(p => {
				invokeRequest(getApp, pathTrunk + (p ? `/${p}` : ''), options)(request)
			})
		})
	}
}

/** GET */
export function get(args: TestRequest): RequestTest {
	return (getApp: GetApp, finalPath: string, options: TestApiOptions) => {
		const testLocation = getCallerLocation()

		doRequest({
			...args,
			method: Method.GET,
			finalPath,
			getApp,
			options,
			testLocation,
		})
	}
}

/** POST */
export function post<TModel extends object, TResponseModel extends object>(
	args: PutRequest<TModel, TResponseModel>
): RequestTest {
	const testLocation = getCallerLocation()

	return (getApp: GetApp, finalPath: string, options: TestApiOptions) => {
		doRequest({
			...args,
			method: Method.POST,
			finalPath,
			getApp,
			options,
			testLocation,
		})
	}
}

/** PUT */
export function put<TModel extends object, TResponseModel extends object>(
	args: PutRequest<TModel, TResponseModel>
): RequestTest {
	const testLocation = getCallerLocation()

	return (getApp: GetApp, finalPath: string, options: TestApiOptions) => {
		doRequest({
			...args,
			method: Method.PUT,
			finalPath,
			getApp,
			options,
			testLocation,
		})
	}
}

/** DELETE */
export function del(args: TestRequest): RequestTest {
	const testLocation = getCallerLocation()

	return (getApp: GetApp, finalPath: string, options: TestApiOptions) => {
		doRequest({
			...args,
			method: Method.DELETE,
			finalPath,
			getApp,
			options,
			testLocation,
		})
	}
}

function getCallerLocation(): string {
	const e = new Error()
	const stack = e.stack!.toString().split(/\r\n|\n/)
	return 'failed api test location ' + stack[3]
}

type FinalRequest = TestRequest & {
	readonly method: Method
	readonly finalPath: string
	readonly getApp: GetApp
	readonly options: TestApiOptions
	readonly testLocation: string
}

function doRequest(args: FinalRequest): void {
	const {name = '', method, finalPath, status} = args

	const testName = oneLine`
		${chalk.magentaBright(method)}
		${finalPath}
		${chalk.magenta(status.toString())}
		${chalk.blue(name)}
	`.trim()

	it(testName, done => doTest(args, testName, done))
}

// eslint-disable-next-line no-empty-function
const noop = async () => {}

function doTest(
	args: FinalRequest, testName: string, done: jest.DoneCallback
) {
	const {
		getApp, contentType, resBody, status, finalPath, method, log, headers,
		before = noop, after = noop, request, authorized = true, options,
		testLocation, validateResponseBodyModel,
	} = args

	before()

	if (authorized && options.authorizedRequests.before) {
		options.authorizedRequests.before()
	}

	let theTest = callHttpMethod(supertest(getApp()), method, finalPath)

	theTest = theTest.set(Header.Origin, 'localhost')

	const newHeaders = {
		...((request && request.headers) || {}),
		...(
			authorized
				? options.authorizedRequests.request.headers || {}
				: {}
		),
	}

	theTest = doRequestStuff()

	theTest = theTest.expect(status)

	if (contentType) {
		theTest = theTest.expect(
			Header.ContentType, ContentTypeRegEx(contentType))
	} else {
		theTest = theTest.expect(res => {
			expect(res.header).not.toHaveProperty(Header.ContentType)
		})
	}

	if (headers) {
		Object.keys(headers).forEach(name => {
			const value = headers[name as Header]!
			// @ts-ignore
			theTest = theTest.expect(name, value)
		})
	}

	if (resBody) {
		if (resBody instanceof RegExp) {
			theTest = theTest.expect(resBody)
		} else {
			theTest = theTest.expect(res => {
				expect(res.body).toEqual(resBody)
			})
		}
	}

	if (validateResponseBodyModel) {
		theTest = theTest.expect(async res => {
			try {
				await transformAndValidate(validateResponseBodyModel, res.body)
			} catch (error) {
				throw new Error('response body failed validation:\n'
					+ error.message
					+ '\nresponse body:\n'
					+ JSON.stringify(res.body, null, 2))
			}
		})
	}

	// eslint-disable-next-line @typescript-eslint/no-floating-promises
	theTest
		.end(async (err, res) => {
			if (log) {
				console.log(testName + ': ' + JSON.stringify({
					status: err ? 'fail' : 'pass',
					request: {
						authorized,
						headers: newHeaders,
					},
					response: {
						status: res.status,
						headers: res.header,
						body: res.body,
					},
				}, null, 2))
			}

			await doAfterAuthRequest()

			try {
				// eslint-disable-next-line @typescript-eslint/await-thenable
				await after()
			} catch (error) {
				console.error('Error caught in the after hook: ', error)
				console.error(testLocation)
				if (!err) throw error
			}

			if (err) {
				console.error(testLocation)
				done(err)
			} else {
				done()
			}
		})

	async function doAfterAuthRequest() {
		if (authorized && options.authorizedRequests.after) {
			await options.authorizedRequests.after()
		}
	}

	function doRequestStuff(): supertest.Test {
		if (request) {
			if (request.upload) {
				theTest = theTest
					.attach(
						request.upload.fileField,
						request.upload.buffer,
						request.upload.fileName)
					.field(request.upload.fields || {})
			} else {
				theTest = theTest
					.send(request.body)
					.set(
						Header.ContentType,
						request.contentType || ContentTypes.ApplicationJson
					)
			}
		}

		Object.keys(newHeaders).forEach(name => {
			theTest = theTest.set(name, newHeaders[name as Header]!)
		})

		return theTest
	}
}

function callHttpMethod(
	st: supertest.SuperTest<supertest.Test>, method: Method, url: string
) {
	switch (method) {
		case Method.GET: return st.get(url)
		case Method.POST: return st.post(url)
		case Method.PUT: return st.put(url)
		case Method.DELETE: return st.delete(url)
	}
}
