import {Fragment, useState} from 'react'
import React from 'react'
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
	const firebase = useFirebase()

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
								/>
							</div>
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

		return firebase.auth
			.signInWithEmailAndPassword(email, password)
			.then(() => dispatch(chatSystemMessage('Logged in!')))
			.then(handleAuthSuccess)
			.catch(handleAuthError)
			.then(enableInputs)
	}

	function handleResetPassword() {
		disableInputs()

		return firebase.auth
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
		return firebase.auth
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

export const ConnectedAuth = shamuConnect(
	(state): ReduxProps => {
		const authState = selectAuthState(state)
		return {
			loggedIn: authState.loggedIn,
			logInError: authState.logInError,
		}
	},
)(Auth)
