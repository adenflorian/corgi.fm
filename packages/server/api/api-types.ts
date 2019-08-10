import {Headers} from '@corgifm/common/common-types'
import {Request, Response} from 'express'

export enum Method {
	GET = 'GET',
	POST = 'POST',
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
	originalRequest: Request
	originalResponse: Response,
}

export interface RoutedRequest extends ApiRequest {
	truncatedPath: string
}

export interface SecureApiRequest extends RoutedRequest {
	callerUid: Id
	emailVerified: boolean
}

export interface SecureUsersApiRequest extends SecureApiRequest {
	pathUid: Id
}

export type ApiResponse<TBody = object | number> = {
	status: 204
} | {
	status: Exclude<Status, 204>
	body: TBody
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
