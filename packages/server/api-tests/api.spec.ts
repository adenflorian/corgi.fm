import {Application} from 'express'
import * as uuid from 'uuid'
import {ManagedUpload} from 'aws-sdk/clients/s3'
import {S3} from 'aws-sdk/clients/all'
import {configureServerStore} from '@corgifm/common/redux'
import {mockUuid} from '@corgifm/common/test-common'
import {testApi, path, get, del, ContentTypes} from '@corgifm/api-tester'
import {logger} from '@corgifm/common/logger'
import {connectDB, DBStore} from '../database/database'
import {setupExpressApp} from '../setup-express-app'
import * as serverAuth from '../auth/server-auth'
import * as corgiS3 from '../api/s3'
import {
	apiRouteNotFoundResponse, emailVerifiedUidA, validTokenVerifiedEmailUidARequest,
} from './api-test-common'
import {getUserApiTests} from './users-api-tests'
import {getSampleApiTests} from './samples-api-tests'

jest.mock('uuid')
jest.mock('../api/s3')
jest.mock('../auth/server-auth')

const mockCreateNodeId = uuid.v4 as unknown as jest.Mock<string>

mockCreateNodeId.mockImplementation(() => mockUuid)

const mockS3Upload = corgiS3.s3Upload as unknown as
	jest.Mock<Promise<ManagedUpload.SendData>, [S3.PutObjectRequest]>

mockS3Upload.mockImplementation(
	async (params): Promise<ManagedUpload.SendData> => {
		return {
			Bucket: 'mockBucket',
			ETag: 'mockETag',
			Key: params.Key,
			Location: 'mockLocation',
		}
	})

const verifyAuthHeaderMock =
	serverAuth.verifyAuthHeader as
	unknown as
	jest.Mock<ReturnType<typeof serverAuth.verifyAuthHeader>>

describe('API Tests', () => {
	let db: DBStore
	let app: Application
	const getApp = () => app
	const getDb = () => db

	beforeAll(async () => {
		db = await connectDB()
		app = await setupExpressApp(configureServerStore(), db)
	})

	beforeEach(() => {
		mockAuthToFail()
	})

	afterEach(async () => {
		await dropCollections()
	})

	afterAll(async () => {
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
					after: async () => logger.enable(),
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
						resBody: apiRouteNotFoundResponse,
					}),
				]),
				path('users', getUserApiTests(getDb, verifyAuthHeaderMock)),
				path('samples', getSampleApiTests(getDb, verifyAuthHeaderMock)),
			]),
		], {
			authorizedRequests: {
				before: emailVerifiedUidA(verifyAuthHeaderMock),
				request: validTokenVerifiedEmailUidARequest,
			},
		})
	})

	function mockAuthToFail() {
		verifyAuthHeaderMock.mockResolvedValue({
			authenticated: false,
			emailVerified: false,
			uid: '',
		})
	}

	async function dropCollections() {
		await db.db.dropDatabase()
	}
})
