import {Fragment} from 'react'
import React from 'react'
import {Dispatch} from 'redux'
import {selectAuthState, shamuConnect} from '../../common/redux'
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

			return (
				<div className="modalSection">
				</div>
			)
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
