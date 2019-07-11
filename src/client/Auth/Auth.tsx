import * as firebase from 'firebase/app'
import * as firebaseui from 'firebaseui'
import {Fragment, useEffect} from 'react'
import React from 'react'
import {Dispatch} from 'redux'
import {logger} from '../../common/logger'
import {authActions, selectAuthState, shamuConnect} from '../../common/redux'
import {Button} from '../Button/Button'
import {useFirebase} from '../Firebase/FirebaseContext'
import {Modal} from '../Modal/Modal'
import './Auth.less'

interface ReduxProps {
	loggedIn: boolean
	logInError: boolean
}

type AllProps = ReduxProps & {dispatch: Dispatch}

export const Auth = React.memo(
	function _Auth({dispatch, loggedIn}: AllProps) {
		const [visible, setVisible] = React.useState(false)
		const firebaseContext = useFirebase()

		return (
			<Fragment>
				<Button
					buttonProps={{
						onClick: () => loggedIn
							? firebaseContext.auth.signOut()
							: setVisible(!visible),
					}}
				>
					{loggedIn ? `Log Out` : `Log In / Register`}
				</Button>
				{visible &&
					<Modal
						onHide={() => setVisible(false)}
						className="authModal"
					>
						<AuthModalInner />
					</Modal>
				}
			</Fragment>
		)

		function AuthModalInner() {

			useEffect(() => {
				firebaseContext.authUi.start('#firebaseAuth', getFirebaseAuthUiConfig())
			})

			return (
				<div id="firebaseAuth" className="modalSection">
				</div>
			)
		}

		function getFirebaseAuthUiConfig(): firebaseui.auth.Config {
			return {
				callbacks: {
					signInSuccessWithAuthResult: authResult => {
						// See wireUpFirebaseToRedux() in FirebaseContext.ts for more callbacks when a user signs in
						logger.log({authResult})
						if (authResult && authResult.additionalUserInfo && authResult.additionalUserInfo.isNewUser) {
							dispatch(authActions.onRegister())
						}
						setVisible(false)
						return false
					},
					signInFailure: error => {
						logger.error('signInFailure: ', {error})
						dispatch(authActions.logInError())
						setVisible(false)
						return Promise.resolve()
					},
				},
				signInOptions: [
					firebase.auth.EmailAuthProvider.PROVIDER_ID,
					firebase.auth.GoogleAuthProvider.PROVIDER_ID,
				],
				signInFlow: 'popup',
				credentialHelper: firebaseui.auth.CredentialHelper.NONE,
				tosUrl: '/terms',
				privacyPolicyUrl: '/privacy',
			}
		}
	},
)

export const ConnectedAuth = shamuConnect(
	(state): ReduxProps => {
		const authState = selectAuthState(state)
		return {
			loggedIn: authState.loggedIn,
			logInError: authState.logInError,
		}
	},
)(Auth)
