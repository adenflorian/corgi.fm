import {
	RequestTest, path, get, put, ContentTypes,
} from '@corgifm/api-tester'
import {User, UserUpdate, makeUser} from '@corgifm/common/models/User'
import {DBStore} from '../database/database'
import {
	VerifyAuthHeaderMock,
	emailNotVerifiedUidB, emptyObjectBodyRequest, fakeTokenRequest,
	validTokenUnverifiedEmailUidBRequest, validTokenVerifiedEmailUidARequest,
	uidZ, uidA, putValidationTests,
} from './api-test-common'

const notAuthorizedA = /not authorized A/
const notAuthorizedB = /not authorized to access this user/

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
				status: 403,
				contentType: ContentTypes.ApplicationJson,
				resBody: notAuthorizedB,
			}),
			put({
				status: 403,
				contentType: ContentTypes.ApplicationJson,
				resBody: notAuthorizedB,
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
					name: 'different uid in path than in JWT',
					status: 403,
					contentType: ContentTypes.ApplicationJson,
					resBody: notAuthorizedB,
				}),
			]),
			path(uidA, [
				get({
					name: 'user not in DB',
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
							color: '#FFFFFF',
						}, uidA)
					},
					status: 200,
					contentType: ContentTypes.ApplicationJson,
					resBody: ((): User => ({
						displayName: 'userAlpha',
						uid: uidA,
						color: '#FFFFFF',
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
				resBody: /missing authorization header/,
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
			...putValidationTests<UserUpdate>([{
				name: 'too long display name',
				body: {
					displayName: '123456789012345678901234567890123456789012345678',
					color: 'red',
				},
				constraints: {
					displayName: displayNameMustLte42,
					color: colorMustBeHex,
				},
			}, {
				name: 'too short display name',
				body: {displayName: '', color: ''},
				constraints: {
					displayName: displayNameMustGte1,
					color: colorMustBeHex,
				},
			}]),
			put<UserUpdate>({
				name: 'successful update2',
				request: {
					body: {displayName: 'user_A', color: 'hsl(0, 19%, 100%)'},
				},
				status: 204,
				after: async () => {
					expect(await getDb().users.getByUid(uidA)).toEqual(makeUser({
						uid: uidA,
						displayName: 'user_A',
						color: 'hsl(0, 19%, 100%)',
					}))
				},
			}),
		]
	}
}

const userNotFound = {
	message: `userNotFound`,
} as const

const displayNameMustLte42 = {
	length: 'displayName must be shorter than or equal to 42 characters',
} as const

const colorMustBeHex = {
	matches: 'color must match '
		+ '/^('
		+ '#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|'
		+ 'hsl\\(\\d{1,3}, ?\\d{1,3}%, ?\\d{1,3}%\\))$/ regular expression',
} as const

const displayNameMustGte1 = {
	length: 'displayName must be longer than or equal to 1 characters',
} as const
