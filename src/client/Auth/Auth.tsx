import * as firebase from 'firebase/app'
import {Fragment, useState} from 'react'
import React from 'react'
import {
	IoLogoFacebook as Facebook, IoLogoGoogle as Google,
} from 'react-icons/io'
import {Dispatch} from 'redux'
import {AuthConstants} from '../../common/auth-constants'
import {
	authActions, chatSystemMessage, selectAuthState, shamuConnect,
} from '../../common/redux'
import {Button} from '../Button/Button'
import {
	FirebaseAuthError, FirebaseAuthErrorCode,
} from '../Firebase/firebase-types'
import {useFirebase} from '../Firebase/FirebaseContext'
import {Modal} from '../Modal/Modal'
import {useBoolean, useResettableState} from '../react-hooks'
import './Auth.less'

interface ReduxProps {
	loggedIn: boolean
	logInError: boolean
}

type AllProps = ReduxProps & {dispatch: Dispatch}

export const Auth = React.memo(_Auth)

function _Auth({dispatch, loggedIn}: AllProps) {
	const [isModalVisible, showModal, hideModal2] = useBoolean(false)
	const [email, setEmail] = useState('')
	const [password, setPassword, clearPassword] = useResettableState('')
	const [authInfo, setAuthInfo, clearAuthInfo] = useResettableState<[string, 'error' | 'info']>(['', 'error'])
	const [inputsDisabled, disableInputs, enableInputs] = useBoolean(false)
	const firebaseContext = useFirebase()

	return (
		<Fragment>
			<Button
				buttonProps={{onClick: loggedIn ? logout : showModal}}
			>
				{loggedIn ? `Log Out` : `Log In / Register`}
			</Button>
			{isModalVisible && modal()}
		</Fragment>
	)

	function modal() {
		return (
			<Modal
				onHide={hideModal}
				className="authModal"
			>
				<div className="modalSection">
					<div className="modalSectionLabel">
						Login or Register
						</div>
					<div className="modalSectionSubLabel">
						Remember to drink water!
						</div>
					<div className="content">
						<form onSubmit={handleLogin}>
							<input
								type="email"
								placeholder="Email"
								className="email"
								value={email}
								onChange={e => setEmail(e.target.value)}
								disabled={inputsDisabled}
								required
							/>
							<input
								type="password"
								placeholder="Password"
								className="password"
								value={password}
								onChange={e => setPassword(e.target.value)}
								disabled={inputsDisabled}
								required
								{...AuthConstants.password}
							/>
							<div className="submitRow">
								<input
									type="submit"
									className="button register"
									value={'Login/Register'}
									disabled={inputsDisabled}
								/>
								<input
									type="button"
									className="button resetPassword"
									value={'Reset Password'}
									disabled={inputsDisabled}
									onClick={handleResetPassword}
									readOnly
								/>
							</div>
							<button
								className="button google"
								disabled={inputsDisabled}
								onClick={() => handleProviderLogin(
									firebase.auth.GoogleAuthProvider)}
							>
								<Google /><span>Sign in with Google</span>
							</button>
							<button
								className="button facebook"
								disabled={inputsDisabled}
								onClick={() => handleProviderLogin(
									firebase.auth.FacebookAuthProvider)}
							>
								<Facebook /><span>Sign in with Facebook</span>
							</button>
						</form>
						{authInfo[0] &&
							<div className={`${authInfo[1]}`}>
								{authInfo[0]}
							</div>
						}
					</div>
				</div>
			</Modal>
		)
	}

	function handleLogin(e: React.FormEvent) {
		e.preventDefault()
		disableInputs()

		return handleLoginPromise(
			firebaseContext.auth.signInWithEmailAndPassword(email, password))
	}

	function handleProviderLogin(authProviderMaker: AuthProviderMaker) {
		disableInputs()

		return handleLoginPromise(
			firebaseContext.auth.signInWithPopup(
				new authProviderMaker()))
	}

	function handleLoginPromise(
		promise: Promise<firebase.auth.UserCredential>,
	) {
		return promise
			.then(() => dispatch(chatSystemMessage('Logged in!')))
			.then(handleAuthSuccess)
			.catch(handleAuthError)
			.then(enableInputs)
	}

	function handleResetPassword() {
		disableInputs()

		return firebaseContext.auth
			.sendPasswordResetEmail(email)
			.then(() => setAuthInfo(['Password reset email sent!', 'info']))
			.catch(handleAuthError)
			.then(enableInputs)
	}

	function handleAuthError(error: FirebaseAuthError): any {
		clearAuthInfo()

		switch (error.code) {
			case FirebaseAuthErrorCode.USER_DELETED: return handleRegister()
			default: return setAuthInfo([error.message, 'error'])
		}
	}

	function handleRegister() {
		return firebaseContext.auth
			.createUserWithEmailAndPassword(email, password)
			.then(dispatchOnRegister)
			.then(handleAuthSuccess)
			.catch(handleAuthError)
	}

	function dispatchOnRegister() {
		dispatch(authActions.onRegister())
	}

	function handleAuthSuccess() {
		hideModal()
		clearAuthInfo()
		clearPassword()
	}

	function hideModal() {
		hideModal2()
		clearPassword()
	}

	async function logout() {
		await firebaseContext.auth.signOut()
		dispatch(chatSystemMessage('Logged out!'))
	}
}

type AuthProviderMaker = new () => firebase.auth.AuthProvider

export const ConnectedAuth = shamuConnect(
	(state): ReduxProps => {
		const authState = selectAuthState(state)
		return {
			loggedIn: authState.loggedIn,
			logInError: authState.logInError,
		}
	},
)(Auth)
