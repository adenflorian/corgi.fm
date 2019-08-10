import * as multer from 'multer'
import {
	maxSampleUploadFileSizeMB, defaultS3BucketName,
} from '@corgifm/common/common-constants'
import {logger} from '@corgifm/common/logger'
import {Upload} from '@corgifm/common/models/OtherModels'
import {
	MBtoBytes, createNodeId, validateSampleFilenameExtension,
} from '@corgifm/common/common-utils'
import {DBStore} from '../database/database'
import {ServerStore} from '../server-redux-types'
import {routeIfSecure} from '../security-middleware'
import {CorgiBadRequestError} from '../api-error'
import {getServerEnv} from '../is-prod-server'
import {getServerVersion} from '../server-version'
import {
	ApiResponse, Method, SecureApiRequest,
	defaultResponse, RoutedRequest, ApiRequest,
} from './api-types'
import {s3Upload} from './s3'

// If a setting is 0 it might mean infinite, so do minimum of 1
const multerOptions: multer.Options = {
	storage: multer.memoryStorage(),
	limits: {
		fieldNameSize: 4, // bytes max (file)
		fieldSize: 1, // bytes
		fields: 1, // count of non file fields
		fileSize: MBtoBytes(maxSampleUploadFileSizeMB), // bytes
		files: 1, // count
		headerPairs: 1, // count
		parts: 1, // count (0 fields + 1 file)
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

		const path = await uploadToS3(request, receivedUpload)

		const upload: Upload = {
			ownerUid: request.callerUid,
			sizeBytes: receivedUpload.file.size,
			path,
		}

		await dbStore.uploads.put(upload)

		return {
			status: 200,
			body: upload,
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

						if (!file) throw new CorgiBadRequestError('invalid upload request')

						const {error, extension} =
							validateSampleFilenameExtension(file.originalname)

						if (error) throw new CorgiBadRequestError(error)

						const result: UploadResult = {
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
): Promise<string> {

	const serverEnv = getServerEnv()

	const key = serverEnv + '/user/' + createNodeId()
		+ uploadResult.validatedExtension

	const result = await s3Upload({
		Bucket: defaultS3BucketName,
		Key: key,
		Body: uploadResult.file.buffer,
		ACL: 'public-read',
		Metadata: {
			corgiUserUploaderUid: request.callerUid.toString(),
			corgiServerEnv: serverEnv,
			corgiServerVersion: getServerVersion(),
		},
	})

	logger.log(`uploaded to s3: `, {result})

	return result.Key.replace(/^(dev|test|prod)\//, '')
}

interface UploadResult {
	readonly file: Express.Multer.File
	readonly validatedExtension: string
}
