import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Tracks} from '../DAW/Tracks'
import {IAppState} from '../redux/configureStore'
import {IDawState} from '../redux/daw-redux'
import './DAW.less'

interface IDawProps {
	daw: IDawState
}

export class DAW extends Component<IDawProps> {
	public render() {
		const {daw} = this.props

		return (
			<Tracks tracks={daw.tracks} />
		)
	}
}

export const ConnectedDAW = connect((state: IAppState) => ({
	daw: state.daw,
}))(DAW)
