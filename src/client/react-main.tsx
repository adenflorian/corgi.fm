import React = require('react')
import ReactDOM = require('react-dom')
import {hot} from 'react-hot-loader'
import {Provider} from 'react-redux'
import {Store} from 'redux'
import {ConnectedApp} from './App'
import {FirebaseContext, FirebaseContextStuff} from './Firebase/FirebaseContext'
import {SvgGradients} from './SvgGradients'

export function renderApp(store: Store, firebaseContextStuff: FirebaseContextStuff) {
	const HotProvider = hot(module)(Provider)
	ReactDOM.render(
		<HotProvider store={store}>
			<FirebaseContext.Provider value={firebaseContextStuff}>
				<React.Fragment>
					<ConnectedApp />
					<SvgGradients />
				</React.Fragment>
			</FirebaseContext.Provider>
		</HotProvider>,
		document.getElementById('react-app'),
	)
}

export function renderOther(other: any) {
	ReactDOM.render(
		other,
		document.getElementById('react-app'),
	)
}
