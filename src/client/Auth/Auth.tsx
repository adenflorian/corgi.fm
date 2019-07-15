import * as firebase from 'firebase/app'
import {useCallback, useState} from 'react'
import React, {Fragment} from 'react'
import {
	IoLogoFacebook as Facebook, IoLogoGoogle as Google,
} from 'react-icons/io'
import {useDispatch, useSelector} from 'react-redux'
import {AuthConstants} from '../../common/auth-constants'
import {
	authActions, chatSystemMessage, ModalId, modalsAction, selectLoggedIn,
} from '../../common/redux'
import {Button} from '../Button/Button'
import {
	FirebaseAuthError, FirebaseAuthErrorCode,
} from '../Firebase/firebase-types'
import {useFirebase} from '../Firebase/FirebaseContext'
import {ModalContent} from '../Modal/ModalManager'
import {useBoolean, useResettableState} from '../react-hooks'
import './Auth.less'

export function AuthModalButton() {
	const loggedIn = useSelector(selectLoggedIn)
	const firebaseContext = useFirebase()
	const dispatch = useDispatch()
	const onClick = useCallback(
		loggedIn ? logout : showModal,
		[loggedIn],
	)

	return (
		<Button
			onClick={onClick}
		>
			{loggedIn ? `Log Out` : `Register / Login`}
		</Button>
	)

	async function logout() {
		await firebaseContext.auth.signOut()
		dispatch(chatSystemMessage('Logged out!'))
	}

	function showModal() {
		dispatch(modalsAction.set(ModalId.Auth))
	}
}

export const AuthModalContent: ModalContent = ({hideModal}) => {
	const [email, setEmail] = useState('')
	const [password, setPassword, clearPassword] = useResettableState('')
	const [authInfo, setAuthInfo, clearAuthInfo] = useResettableState<[string, 'error' | 'info']>(['', 'error'])
	const [inputsDisabled, disableInputs, enableInputs] = useBoolean(false)
	const firebaseContext = useFirebase()
	const dispatch = useDispatch()

	return modal()

	function modal() {
		return (
			<Fragment>
				<div className="modalSection authModal login">
					<div className="modalSectionLabel">
						Register or Login
					</div>
					<div className="modalSectionSubLabel">
						Remember to drink water!
					</div>
					<div className="modalSectionContent">
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
									value={'Register / Login'}
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
						</form>
					</div>
					{authInfo[0] &&
						<div className="modalSectionFooter">
							<div className={`bottom ${authInfo[1]}`}>
								{authInfo[0]}
							</div>
						</div>
					}
				</div>
				<div className="modalSection authModal other">
					<div className="modalSectionLabel">
						Other Login Methods
					</div>
					<div className="modalSectionSubLabel">
						Woof
					</div>
					<div className="modalSectionContent providers">
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
					</div>
				</div>
			</Fragment>
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
		_hideModal()
		clearAuthInfo()
		clearPassword()
	}

	function _hideModal() {
		hideModal()
		clearPassword()
	}
}

type AuthProviderMaker = new () => firebase.auth.AuthProvider
