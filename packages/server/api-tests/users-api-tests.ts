import {
	RequestTest, path, get, put, ContentTypes,
} from '@corgifm/api-tester'
import {User} from '@corgifm/common/models/User'
import {DBStore} from '../database/database'
import {
	apiRouteNotFound, VerifyAuthHeaderMock, putValidationTests,
	emailNotVerifiedUidB, emptyObjectBodyRequest, fakeTokenRequest,
	validTokenUnverifiedEmailUidBRequest, validTokenVerifiedEmailUidARequest,
	uidZ, uidA,
} from './api-test-common'

const notAuthorizedA = /not authorized A/
const notAuthorizedB = /not authorized B/

export function getUserApiTests(
	getDb: () => DBStore,
	verifyAuthHeaderMock: VerifyAuthHeaderMock
): RequestTest[] {
	return [
		path('', emptyPathTests()),
		path('count', countTests()),
		...getUserTests(),
		...putUserTests(),
	]

	function emptyPathTests(): RequestTest[] {
		return [
			get({
				status: 404,
				contentType: ContentTypes.ApplicationJson,
				resBody: apiRouteNotFound,
			}),
			put({
				status: 404,
				contentType: ContentTypes.ApplicationJson,
				resBody: apiRouteNotFound,
				request: {body: {}},
			}),
		]
	}

	function countTests(): RequestTest[] {
		return [
			get({
				status: 200,
				contentType: ContentTypes.ApplicationJson,
				resBody: 0,
			}),
		]
	}

	function getUserTests(): RequestTest[] {
		return [
			path(uidZ, [
				get({
					status: 403,
					contentType: ContentTypes.ApplicationJson,
					resBody: notAuthorizedB,
				}),
			]),
			path(uidA, [
				get({
					status: 404,
					contentType: ContentTypes.ApplicationJson,
					resBody: userNotFound,
				}),
			]),
			path(uidA, [
				get({
					before: async () => {
						await getDb().users.updateOrCreate({
							displayName: 'userAlpha',
						}, uidA)
					},
					status: 200,
					contentType: ContentTypes.ApplicationJson,
					resBody: ((): User => ({
						displayName: 'userAlpha',
						uid: uidA,
					}))(),
				}),
			]),
		]
	}

	function putUserTests(): RequestTest[] {
		return [
			path(uidZ, putUnknownUserTests()),
			path(uidA, putUserATests()),
		]
	}

	function putUnknownUserTests(): RequestTest[] {
		return [
			put({
				name: 'missing Authorization header',
				request: emptyObjectBodyRequest,
				authorized: false,
				status: 401,
				contentType: ContentTypes.ApplicationJson,
				resBody: /missing Authorization header/,
			}),
			put({
				name: 'invalid Authorization header',
				request: fakeTokenRequest,
				authorized: false,
				status: 401,
				contentType: ContentTypes.ApplicationJson,
				resBody: /invalid\/expired token/,
			}),
			put({
				name: 'email not verified',
				before: emailNotVerifiedUidB(verifyAuthHeaderMock),
				request: validTokenUnverifiedEmailUidBRequest,
				authorized: false,
				status: 403,
				contentType: ContentTypes.ApplicationJson,
				resBody: notAuthorizedA,
			}),
			put({
				name: `uid mismatch - JWT has uidA but path has uidZ`,
				request: validTokenVerifiedEmailUidARequest,
				status: 403,
				contentType: ContentTypes.ApplicationJson,
				resBody: notAuthorizedB,
			}),
		]
	}

	function putUserATests() {
		return [
			...putValidationTests('displayName', [{
				name: 'invalid display name type',
				body: {displayName: ['a', 'a', 'a', 'a', 'a,']},
				constraints: displayNameMustBeBetween1And42,
			}, {
				name: 'too short display name',
				body: {displayName: ''},
				constraints: displayNameMustGte1,
			}]),
			put({
				name: 'successful update2',
				request: {
					body: {displayName: 'user_A'},
				},
				contentType: null,
				status: 204,
				resBody: null,
				after: async () => {
					expect(await getDb().users.getByUid(uidA)).toEqual({
						uid: uidA,
						displayName: 'user_A',
					})
				},
			}),
		]
	}
}

const userNotFound = {
	message: `userNotFound`,
} as const

const displayNameMustBeBetween1And42 = {
	length: 'displayName must be longer than or equal to 1 '
		+ 'and shorter than or equal to 42 characters',
}

const displayNameMustGte1 = {
	length: 'displayName must be longer than or equal to 1 characters',
}
