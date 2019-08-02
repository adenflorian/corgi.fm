import * as admin from 'firebase-admin'
import {logger} from '@corgifm/common/logger'
import {getFirebaseServerConfig} from '../firebase-server-config'

admin.initializeApp(getFirebaseServerConfig())

// TODO Make better
// TODO Test
export async function verifyAuthHeader(
	authHeaderValue: string
): Promise<AuthResult> {
	const jwt = authHeaderValue.replace(/Bearer /, '')

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

interface AuthResult {
	authenticated: boolean
	emailVerified: boolean
	uid: Id
}
