import * as admin from 'firebase-admin'
import {logger} from '@corgifm/common/logger'
import {getFirebaseServerConfig} from '../firebase-server-config'

admin.initializeApp(getFirebaseServerConfig())

// TODO Make better
// TODO Test
export async function verifyAuthHeader(
	authHeaderValue: string
): Promise<AuthResult> {
	const jwt = getJwtFromAuthHeaderValue(authHeaderValue)

	return admin.auth().verifyIdToken(jwt)
		.then((decodedToken): AuthResult => {
			return {
				authenticated: true,
				emailVerified: decodedToken.email_verified,
				uid: decodedToken.uid,
			}
		}).catch((error): AuthResult => {
			logger.log({authError: error})
			return {
				authenticated: false,
				emailVerified: false,
				uid: '',
			}
		})
}

function getJwtFromAuthHeaderValue(authHeaderValue: string) {
	return authHeaderValue.replace(/Bearer /, '')
}

interface AuthResult {
	authenticated: boolean
	emailVerified: boolean
	uid: Id
}
