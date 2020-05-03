import React, {useEffect} from 'react'
import {hot} from 'react-hot-loader'
import {useSelector} from 'react-redux'
import {selectClientInfo, IClientAppState, selectUserInputKeys} from '@corgifm/common/redux'
// css-reset must be first
import './css-reset.css'
import './App.less'
import {isLocalDevClient} from './is-prod-client'
import {LoadingScreen} from './LoadingScreen'
import {ConnectedOnlineApp} from './OnlineApp'
import {Benchmarks} from './Benchmarks'
import {simpleGlobalClientState} from './SimpleGlobalClientState'
import {useRoomType} from './react-hooks'
import {RoomType} from '@corgifm/common/common-types'
import {MainWebGlCanvas} from './MainWebGlCanvas'

const App = () => {
	const ctrl = useSelector((state: IClientAppState) => selectUserInputKeys(state).ctrl)
	const shift = useSelector((state: IClientAppState) => selectUserInputKeys(state).shift)
	const alt = useSelector((state: IClientAppState) => selectUserInputKeys(state).alt)
	const isConnectingForFirstTime = useSelector((state: IClientAppState) => selectClientInfo(state).isConnectingForFirstTime)
	const isClientReady = useSelector((state: IClientAppState) => selectClientInfo(state).isClientReady)
	const roomType = useRoomType()

	useEffect(() => {
		const onMouseMove = (e: MouseEvent) => {
			simpleGlobalClientState.lastMousePosition.x = e.clientX
			simpleGlobalClientState.lastMousePosition.y = e.clientY
		}

		window.addEventListener('mousemove', onMouseMove)

		return () => {
			window.removeEventListener('mousemove', onMouseMove)
		}
	}, [])

	if (isLocalDevClient()) {
		switch (window.location.pathname.replace('/', '')) {
			case 'benchmarks': return <Benchmarks />
			default: break
		}
	}

	const isLoading = !isClientReady && isConnectingForFirstTime
	return (
		<div className={`ctrl-${ctrl} alt-${alt} shift-${shift}`}>
			<MainWebGlCanvas />
			<LoadingScreen loading={isLoading} />
			{!isLoading && {
				[RoomType.Normal]: <ConnectedOnlineApp />,
				[RoomType.Experimental]: <ConnectedOnlineApp />,
				[RoomType.Dummy]: <div>DuMmY</div>,
			}[roomType]}
		</div>
	)
}

export const ConnectedApp = hot(module)(App)
