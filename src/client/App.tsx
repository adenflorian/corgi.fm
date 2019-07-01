import React from 'react'
import {hot} from 'react-hot-loader'
import {connect} from 'react-redux'
import {selectClientInfo} from '../common/redux'
import {IClientAppState} from '../common/redux'
// css-reset must be first
import './css-reset.css'
// tslint:disable-next-line:ordered-imports
import './App.less'
import {isLocalDevClient} from './is-prod-client'
import {LoadingScreen} from './LoadingScreen'
import {ConnectedOnlineApp} from './OnlineApp'

interface IAppProps {
	isConnectingForFirstTime: boolean
	isClientReady: boolean
}

class App extends React.Component<IAppProps, {}> {
	public render() {
		const {isConnectingForFirstTime, isClientReady} = this.props

		if (isLocalDevClient()) {
			switch (window.location.pathname.replace('/', '')) {
			}
		}

		const isLoading = !isClientReady && isConnectingForFirstTime

		return (
			<React.Fragment>
				<LoadingScreen loading={isLoading} />
				{!isLoading && <ConnectedOnlineApp />}
			</React.Fragment>
		)
	}
}

const mapStateToProps = (state: IClientAppState) => {
	const {isConnectingForFirstTime, isClientReady} = selectClientInfo(state)

	return {
		isConnectingForFirstTime,
		isClientReady,
	}
}

export const ConnectedApp = hot(module)(connect(mapStateToProps)(App))
