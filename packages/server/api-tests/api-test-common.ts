import * as serverAuth from '../auth/server-auth'

export const apiRouteNotFound = /couldn't find an api route/

export type VerifyAuthHeaderMock =
	jest.Mock<ReturnType<typeof serverAuth.verifyAuthHeader>>
