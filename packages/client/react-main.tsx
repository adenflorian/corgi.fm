import React from 'react'
import ReactDOM from 'react-dom'
import {hot} from 'react-hot-loader'
import {Provider} from 'react-redux'
import {Store} from 'redux'
import {ConnectedApp} from './App'
import {FirebaseContext, FirebaseContextStuff} from './Firebase/FirebaseContext'
import {SvgGradients} from './SvgGradients'
import {SingletonContext, SingletonContextImpl} from './SingletonContext'

export function renderApp(
	store: Store,
	firebaseContextStuff: FirebaseContextStuff,
	singletonContext: SingletonContextImpl,
) {
	const HotProvider = hot(module)(Provider)
	ReactDOM.render(
		<HotProvider store={store}>
			<FirebaseContext.Provider value={firebaseContextStuff}>
				<SingletonContext.Provider value={singletonContext}>
					<React.Fragment>
						<ConnectedApp />
						<SvgGradients />
					</React.Fragment>
				</SingletonContext.Provider>
			</FirebaseContext.Provider>
		</HotProvider>,
		getReactAppElement(),
	)
}

export function renderOther(other: any) {
	ReactDOM.render(
		other,
		getReactAppElement(),
	)
}

function getReactAppElement() {
	return document.querySelector('#react-app')
}
