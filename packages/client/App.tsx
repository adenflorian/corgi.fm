import React from 'react'
import {hot} from 'react-hot-loader'
import {useSelector} from 'react-redux'
import {selectClientInfo, IClientAppState, selectUserInputKeys, RoomType} from '@corgifm/common/redux'
// css-reset must be first
import './css-reset.css'
import './App.less'
import {isLocalDevClient} from './is-prod-client'
import {LoadingScreen} from './LoadingScreen'
import {ConnectedOnlineApp} from './OnlineApp'
import {Benchmarks} from './Benchmarks'

const App = () => {
	const ctrl = useSelector((state: IClientAppState) => selectUserInputKeys(state).ctrl)
	const shift = useSelector((state: IClientAppState) => selectUserInputKeys(state).shift)
	const alt = useSelector((state: IClientAppState) => selectUserInputKeys(state).alt)
	const isConnectingForFirstTime = useSelector((state: IClientAppState) => selectClientInfo(state).isConnectingForFirstTime)
	const isClientReady = useSelector((state: IClientAppState) => selectClientInfo(state).isClientReady)
	const roomType = useSelector((state: IClientAppState) => state.room.roomInfo.roomType)

	if (isLocalDevClient()) {
		switch (window.location.pathname.replace('/', '')) {
			case 'benchmarks': return <Benchmarks />
			default: break
		}
	}

	const isLoading = !isClientReady && isConnectingForFirstTime
	return (
		<div className={`ctrl-${ctrl} alt-${alt} shift-${shift}`}>
			<LoadingScreen loading={isLoading} />
			{!isLoading && {
				[RoomType.Normal]: <ConnectedOnlineApp />,
				[RoomType.Experimental]: <ConnectedOnlineApp />,
			}[roomType]
			}
		</div>
	)
}

export const ConnectedApp = hot(module)(App)
