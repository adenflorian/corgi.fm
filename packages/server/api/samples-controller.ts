import * as multer from 'multer'
import * as S3 from 'aws-sdk/clients/s3'
import {maxSampleUploadFileSizeMB, defaultS3BucketName} from '@corgifm/common/common-constants'
import {logger} from '@corgifm/common/logger'
import {Upload} from '@corgifm/common/models/OtherModels'
import {MBtoBytes, createNodeId, validateSampleFilenameExtension} from '@corgifm/common/common-utils'
import {DBStore} from '../database/database'
import {ServerStore} from '../server-redux-types'
import {routeIfSecure} from '../security-middleware'
import {CorgiBadRequestError} from '../api-error'
import {
	ApiResponse, Method, SecureApiRequest,
	defaultResponse, RoutedRequest, ApiRequest,
} from './api-types'
import {getServerEnv} from '../is-prod-server';
import {getServerVersion} from '../server-version';


const s3 = new S3({
	apiVersion: '2006-03-01',
	endpoint: 'https://nyc3.digitaloceanspaces.com',
})

const multerOptions: multer.Options = {
	storage: multer.memoryStorage(),
	limits: {
		fieldNameSize: 4, // bytes max(file, uid)
		fieldSize: 28, // bytes (uid is 28 chars)
		fields: 1, // count of non file fields (uid)
		fileSize: MBtoBytes(maxSampleUploadFileSizeMB), // bytes
		files: 1, // count
		headerPairs: 1, // count
		parts: 2, // count (1 field + 1 file)
		preservePath: false,
	},
}

const upload = multer(multerOptions)

const uploadSingle = upload.single('file')

export function getSamplesController(
	serverStore: ServerStore, dbStore: DBStore,
) {

	return async function handleSamplesRequest(
		request: RoutedRequest,
	): Promise<ApiResponse> {
		return routeIfSecure(request, secureSamplesRouter)
	}

	async function secureSamplesRouter(
		request: SecureApiRequest,
	): Promise<ApiResponse> {
		if (!['', '/'].includes(request.truncatedPath)) return defaultResponse

		if (request.method === Method.POST) {
			return uploadSample(request)
		} else {
			return defaultResponse
		}
	}

	async function uploadSample(
		request: SecureApiRequest,
	): Promise<ApiResponse<Upload>> {

		const receivedUpload = await receiveUpload(request)

		const s3UploadResult = await uploadToS3(request, receivedUpload)

		await dbStore.uploads.put({
			ownerUid: request.callerUid,
			sizeBytes: receivedUpload.file.size,
			path: s3UploadResult.Key,
		})

		logger.log(`uploaded to s3: `, {s3UploadResult})

		return {
			status: 200,
			body: {
				path: s3UploadResult.Key,
				ownerUid: request.callerUid,
				sizeBytes: receivedUpload.file.size,
			},
		}
	}
}

async function receiveUpload(request: ApiRequest): Promise<UploadResult> {
	return new Promise<UploadResult>(
		(resolve: (result: UploadResult) => void, reject) => {
			uploadSingle(
				request.originalRequest,
				request.originalResponse,
				(err?: any) => {
					if (err) {
						if (err.name === 'MulterError') {
							if (err.code === 'LIMIT_FILE_SIZE') {
								return reject(new CorgiBadRequestError(
									`file too big, limit is ${maxSampleUploadFileSizeMB}MB`))
							}
						}
						return reject(new Error(
							'uploadSingle error: ' + JSON.stringify(err, null, 2)))
					} else {
						const file = request.originalRequest.file

						const {error, extension} =
							validateSampleFilenameExtension(file.originalname)

						if (error) {
							logger.error(
								'invalid uploaded sample extension: ', {error, extension})
							throw new CorgiBadRequestError(error)
						}

						const result: UploadResult = {
							body: request.originalRequest.body,
							file,
							validatedExtension: extension,
						}
						logger.log('successful upload to corgi server: ', result)
						return resolve(result)
					}
				},
			)
		}
	)
}

async function uploadToS3(
	request: SecureApiRequest, uploadResult: UploadResult,
): Promise<S3.ManagedUpload.SendData> {

	const serverEnv = getServerEnv()

	const key = serverEnv + '/user/' + createNodeId()
		+ uploadResult.validatedExtension

	const result = await s3.upload({
		Bucket: defaultS3BucketName,
		Key: key,
		Body: uploadResult.file.buffer,
		ACL: 'public-read',
		Metadata: {
			corgiUserUploaderUid: request.callerUid.toString(),
			corgiServerEnv: serverEnv,
			corgiServerVersion: getServerVersion(),
		},
	}).promise()

	return {
		...result,
		Key: result.Key.replace(/^(dev|test|prod)\//, ''),
	}
}

interface UploadResult {
	readonly body: unknown,
	readonly file: Express.Multer.File,
	readonly validatedExtension: string,
}
