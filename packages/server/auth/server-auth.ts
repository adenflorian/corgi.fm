import * as admin from 'firebase-admin'

admin.initializeApp()

// TODO Make better
// TODO Test
export async function verifyAuthHeader(
	authHeaderValue: string
): Promise<AuthResult> {
	return admin.auth().verifyIdToken(authHeaderValue)
		.then((decodedToken): AuthResult => {
			// const uid = decodedToken.uid
			return {
				authenticated: true,
				emailVerified: decodedToken.email_verified,
			}
		}).catch((error): AuthResult => {
			return {
				authenticated: false,
				emailVerified: false,
			}
		})
}

interface AuthResult {
	authenticated: boolean
	emailVerified: boolean
}
