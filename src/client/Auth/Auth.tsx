import {Fragment, useState} from 'react'
import React from 'react'
import {Dispatch} from 'redux'
import {AuthConstants} from '../../common/auth-constants'
import {authActions, selectAuthState, shamuConnect} from '../../common/redux'
import {Button} from '../Button/Button'
import {
	FirebaseAuthError, FirebaseAuthErrorCode,
} from '../Firebase/firebase-types'
import {useFirebase} from '../Firebase/FirebaseContext'
import {Modal} from '../Modal/Modal'
import {useBoolean} from '../react-hooks'
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
	const [password, setPassword] = useState('')
	const [authError, setAuthError] = useState('')
	const [inputsDisabled, disableInputs, enableInputs] = useBoolean(false)
	const firebaseContext = useFirebase()
	const firebase = useFirebase()

	return (
		<Fragment>
			<Button
				buttonProps={{
					onClick: loggedIn
						? () => firebaseContext.auth.signOut()
						: showModal,
				}}
			>
				{loggedIn ? `Log Out` : `Log In / Register`}
			</Button>
			{isModalVisible &&
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
								<input
									type="submit"
									className="submit register"
									value={'Login/Register'}
									disabled={inputsDisabled}
								/>
							</form>
							{authError &&
								<div className="error">
									{authError}
								</div>
							}
						</div>
					</div>
				</Modal>
			}
		</Fragment>
	)

	function handleLogin(e: React.FormEvent) {
		e.preventDefault()
		disableInputs()

		return firebase.auth
			.signInWithEmailAndPassword(email, password)
			.then(handleAuthSuccess)
			.catch(handleAuthError)
			.then(enableInputs)
	}

	function handleAuthError(error: FirebaseAuthError): any {
		switch (error.code) {
			case FirebaseAuthErrorCode.USER_DELETED: return handleRegister()
			default: return setAuthError(error.message)
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
		clearAuthError()
		clearPassword()
	}

	function hideModal() {
		hideModal2()
		clearPassword()
	}

	function clearAuthError() {
		setAuthError('')
	}

	function clearPassword() {
		setPassword('')
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
