import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Tracks} from '../DAW/Tracks'
import {IAppState} from '../redux/configureStore'
import {IDawState} from '../redux/daw-redux'
import './BasicInstrumentView.css'

interface IBasicInstrumentViewProps {
	daw: IDawState
}

export class BasicInstrumentView extends Component<IBasicInstrumentViewProps> {
	public render() {
		const {daw} = this.props

		return (
			<div>basic</div>
		)
	}
}

export const ConnectedBasicInstrumentView = connect((state: IAppState) => ({
	daw: state.daw,
}))(BasicInstrumentView)
