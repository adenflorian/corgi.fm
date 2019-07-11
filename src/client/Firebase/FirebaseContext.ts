import * as firebase from 'firebase/app'
import * as firebaseui from 'firebaseui'
import React, {useContext} from 'react'
import {Store} from 'redux'
import {authActions, IClientAppState} from '../../common/redux'
import {getFirebaseConfig} from './firebase-config'

export const FirebaseContext = React.createContext<FirebaseContextStuff>({
	app: {} as any,
	auth: {} as any,
	authUi: {} as any,
})

export type FirebaseContextStuff = ReturnType<typeof initializeFirebase>

export function initializeFirebase(store: Store<IClientAppState>) {
	const app = firebase.initializeApp(getFirebaseConfig())

	const auth = firebase.auth(app)

	auth.onAuthStateChanged(user => {
		if (user) {
			store.dispatch(authActions.logIn(user.uid))
		} else {
			store.dispatch(authActions.logOut())
		}
	})

	const authUi = new firebaseui.auth.AuthUI(auth)

	return {
		app,
		auth,
		authUi,
	}
}

export function useFirebase() {
	return useContext(FirebaseContext)
}
