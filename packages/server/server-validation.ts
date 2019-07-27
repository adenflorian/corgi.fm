import {ClassType} from 'class-transformer/ClassTransformer'
import {transformAndValidate} from '@corgifm/common/validation'
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
