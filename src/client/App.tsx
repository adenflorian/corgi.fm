import * as React from 'react'
import {hot} from 'react-hot-loader'
import {connect} from 'react-redux'
import {IAppState} from '../common/redux/client-store'
import {selectIsLocalClientReady} from '../common/redux/clients-redux'
import {ConnectedOnlineApp} from './OnlineApp'

interface IAppProps {
	isLocalClientReady: boolean
}

class App extends React.Component<IAppProps, {}> {
	public render() {
		const {isLocalClientReady} = this.props

		if (isLocalClientReady) {
			return <ConnectedOnlineApp />
		} else {
			return 'connecting...'
		}
	}
}

const mapStateToProps = (state: IAppState) => ({
	isLocalClientReady: selectIsLocalClientReady(state),
})

export const ConnectedApp = hot(module)(connect(mapStateToProps)(App))
