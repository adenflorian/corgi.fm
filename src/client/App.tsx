import * as React from 'react'
import {hot} from 'react-hot-loader'
import {connect} from 'react-redux'
import {selectIsLocalClientReady} from '../common/redux/clients-redux'
import {IClientAppState} from '../common/redux/common-redux-types'
import './App.less'
import './css-reset.css'
import {isLocalDevClient} from './is-prod-client'
import {ConnectedOnlineApp} from './OnlineApp'
import {Options} from './Options/Options'
import {SimpleSequencer} from './SimpleSequencer/SimpleSequencer'

interface IAppProps {
	isLocalClientReady: boolean
}

class App extends React.Component<IAppProps, {}> {
	public render() {
		const {isLocalClientReady} = this.props

		if (isLocalDevClient()) {
			switch (window.location.pathname.replace('/', '')) {
				case 'options': return <Options />
				case 'simpleSequencer': return <SimpleSequencer />
			}
		}

		if (isLocalClientReady) {
			return <ConnectedOnlineApp />
		} else {
			return 'connecting...'
		}
	}
}

const mapStateToProps = (state: IClientAppState) => ({
	isLocalClientReady: selectIsLocalClientReady(state),
})

export const ConnectedApp = hot(module)(connect(mapStateToProps)(App))
