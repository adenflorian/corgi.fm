import {ClassType} from 'class-transformer/ClassTransformer'
import {plainToClass} from 'class-transformer'
import {validateOrReject} from 'class-validator'
import {ApiRequest, ApiResponse} from './api/api-types'

/** Transforms and validates the request body which is passed to the
 * given router. Validation errors will cause a rejection that you can
 * handle in higher up middleware. */
export async function validateBodyThenRoute
<T extends object, R extends ApiRequest>(
	targetClass: ClassType<T>,
	router: (request: R, body: T) => Promise<ApiResponse>,
	request: R,
) {
	const result = await transformAndValidate(targetClass, request.body)

	return router(request, result)
}

export async function transformAndValidate<T extends object>(
	targetClass: ClassType<T>, data: unknown,
): Promise<T> {
	return validateOrRejectCustom(
		plainToClass(targetClass, data))
}

export async function transformAndValidateDbResult<T extends object>(
	targetClass: ClassType<T>, data: unknown,
): Promise<T> {
	return transformAndValidate(targetClass, data)
		.catch(error => {
			throw new Error(
				'[transformAndValidateDbResult] error while validating data from DB: '
				+ JSON.stringify(error, null, 2))
		})
}

async function validateOrRejectCustom<T>(object: T): Promise<T> {
	await validateOrReject(object, {
		validationError: {
			target: false,
		},
		forbidUnknownValues: true,
		whitelist: true,
	})

	return object
}
