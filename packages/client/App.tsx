import React from 'react'
import {hot} from 'react-hot-loader'
import {useSelector} from 'react-redux'
import {selectClientInfo, IClientAppState, selectUserInputKeys} from '@corgifm/common/redux'
// css-reset must be first
import './css-reset.css'
import './App.less'
import {isLocalDevClient} from './is-prod-client'
import {LoadingScreen} from './LoadingScreen'
import {ConnectedOnlineApp} from './OnlineApp'

const App = () => {
	const ctrl = useSelector((state: IClientAppState) => selectUserInputKeys(state).ctrl)
	const isConnectingForFirstTime = useSelector((state: IClientAppState) => selectClientInfo(state).isConnectingForFirstTime)
	const isClientReady = useSelector((state: IClientAppState) => selectClientInfo(state).isClientReady)

	if (isLocalDevClient()) {
		switch (window.location.pathname.replace('/', '')) {
			default: break
		}
	}

	const isLoading = !isClientReady && isConnectingForFirstTime
	return (
		<div className={`ctrl-${ctrl}`}>
			<LoadingScreen loading={isLoading} />
			{!isLoading && <ConnectedOnlineApp />}
		</div>
	)
}

export const ConnectedApp = hot(module)(App)
