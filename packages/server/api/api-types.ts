import {Headers} from '@corgifm/common/common-types'

export enum Method {
	GET = 'GET',
	PUT = 'PUT',
}

export type Status = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 500 | 501

export function isSupportedMethod(method: string): method is Method {
	return method in Method
}

export interface ApiRequest {
	method: Method
	path: string
	headers: Headers
	body: unknown
}

export interface SecureApiRequest extends ApiRequest {
	callerUid: string
	emailVerified: boolean
}

export interface SecureUsersApiRequest extends SecureApiRequest {
	pathUid: string
}

export type ApiResponse = {
	status: 204
} | {
	status: Exclude<Status, 204>
	body: object | number
}

export type Router =
	(request: ApiRequest) => Promise<ApiResponse>

export type SecureRouter =
	(request: SecureApiRequest) => Promise<ApiResponse>

export type SecureBodyRouter<T> =
	(request: SecureApiRequest, body: T) => Promise<ApiResponse>

export const defaultResponse: ApiResponse = {
	status: 404,
	body: {
		message: `couldn't find an api route`,
	},
}
