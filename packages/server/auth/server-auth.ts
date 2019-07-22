import * as admin from 'firebase-admin'

admin.initializeApp()

// TODO Make better
// TODO Test
export async function verifyAuthHeader(
	authHeaderValue: string
): Promise<AuthResult> {
	return admin.auth().verifyIdToken(authHeaderValue)
		.then((decodedToken): AuthResult => {
			return {
				authenticated: true,
				emailVerified: decodedToken.email_verified,
				uid: decodedToken.uid,
			}
		}).catch((error): AuthResult => {
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
	uid: string
}
