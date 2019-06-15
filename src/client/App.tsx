import * as React from 'react'
import {hot} from 'react-hot-loader'
import {connect} from 'react-redux'
import {selectClientInfo} from '../common/redux'
import {IClientAppState} from '../common/redux'
// css-reset must be first
import './css-reset.css'
// tslint:disable-next-line:ordered-imports
import './App.less'
import {isLocalDevClient} from './is-prod-client'
import {OnlineApp} from './OnlineApp'
import {Options} from './Options/Options'
import {SimpleReverbView} from './ShamuNodes/SimpleReverb/SimpleReverbView'

interface IAppProps {
	isConnectingForFirstTime: boolean
	isClientReady: boolean
}

class App extends React.Component<IAppProps, {}> {
	public render() {
		const {isConnectingForFirstTime, isClientReady} = this.props

		if (isLocalDevClient()) {
			switch (window.location.pathname.replace('/', '')) {
				// case 'options': return <Options />
				// case 'reverb': return <SimpleReverbView id="-1" color="red" isPlaying={false} />
				// case 'infiniteSequencer': return <InfiniteSequencer id="fakeId" />
			}
		}

		if (!isClientReady && isConnectingForFirstTime) {
			return <div
				className="largeFont"
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100%',
					fontSize: '2em',
				}}
			>
				Connecting...
			</div>
		} else {
			return <OnlineApp />
		}
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
