import {
	RequestTest, path, get, put, ContentTypes, post,
} from '@corgifm/api-tester'
import {Upload, YourSamples} from '@corgifm/common/models/OtherModels'
import {mockUuid} from '@corgifm/common/test-common'
import {logger} from '@corgifm/common/logger'
import {DBStore} from '../database/database'
import {
	VerifyAuthHeaderMock, missingAuthHeaderResponse, apiRouteNotFoundResponse,
	uidA, uidB,
} from './api-test-common'

export function getSampleApiTests(
	getDb: () => DBStore,
	verifyAuthHeaderMock: VerifyAuthHeaderMock,
): RequestTest[] {

	return [
		path('', emptyPathTests()),
		path('mine', getMySamplesTests()),
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
		].concat(postSamplesTests())
	}

	function postSamplesTests(): RequestTest[] {
		return [
			post({
				name: 'invalid upload request',
				status: 400,
				contentType: ContentTypes.ApplicationJson,
				resBody: /invalid upload request/,
				request: {
					body: {},
				},
			}),
			post({
				name: 'invalid extension',
				status: 400,
				contentType: ContentTypes.ApplicationJson,
				resBody: /Invalid extension/,
				request: {
					upload: {
						fileField: 'file',
						buffer: Buffer.from('12345678'),
						fileName: 'smallFile.ogg',
					},
				},
			}),
			post({
				name: 'too big',
				status: 400,
				contentType: ContentTypes.ApplicationJson,
				resBody: /too big/,
				request: {
					upload: {
						fileField: 'file',
						buffer: makeBigBufferMB(11),
						fileName: 'bigFile.wav',
					},
				},
			}),
			post({
				name: 'user hit upload cap',
				status: 400,
				contentType: ContentTypes.ApplicationJson,
				resBody: /this upload would put your total uploads at/,
				request: {
					upload: {
						fileField: 'file',
						buffer: makeBigBufferMB(1),
						fileName: 'smallFile.wav',
					},
				},
				before: async () => {
					await getDb().uploads.put({
						ownerUid: uidA,
						path: 'fakePath',
						sizeBytes: 100 * 1000 * 1000,
					})
					logger.disable()
				},
				after: async () => logger.enable(),
			}),
			post({
				status: 200,
				contentType: ContentTypes.ApplicationJson,
				resBody: {
					ownerUid: uidA,
					path: `user/${mockUuid}.wav`,
					sizeBytes: 10 * 1000 * 1000,
				},
				validateResponseBodyModel: Upload,
				request: {
					upload: {
						fileField: 'file',
						buffer: makeBigBufferMB(10),
						fileName: 'smallFile.wav',
					},
				},
				before: logger.disable,
				after: async () => logger.enable(),
			}),
		]
	}

	function getMySamplesTests(): RequestTest[] {
		return [
			get({
				status: 200,
				contentType: ContentTypes.ApplicationJson,
				validateResponseBodyModel: YourSamples,
				resBody: {
					yourSamples: [],
				},
			}),
			get<YourSamples>({
				before: () => {
					getDb().uploads.put({
						ownerUid: uidA,
						path: `user/${mockUuid}.wav`,
						sizeBytes: 1000,
					})
					getDb().uploads.put({
						ownerUid: uidB,
						path: `user/${mockUuid}.wav`,
						sizeBytes: 2000,
					})
					getDb().uploads.put({
						ownerUid: uidA,
						path: `user/${mockUuid}.wav`,
						sizeBytes: 3000,
					})
				},
				status: 200,
				contentType: ContentTypes.ApplicationJson,
				resBody: {
					yourSamples: [{
						ownerUid: uidA,
						path: `user/${mockUuid}.wav`,
						sizeBytes: 1000,
					}, {
						ownerUid: uidA,
						path: `user/${mockUuid}.wav`,
						sizeBytes: 3000,
					}]
				},
			}),
		]
	}
}

function makeBigBufferMB(megabytes: number) {
	return Buffer.alloc(megabytes * 1000 * 1000)
}
