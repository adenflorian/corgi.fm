import Color from 'color'
import 'rc-slider/assets/index.css'
import {Component} from 'react'
import React = require('react')
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IAppState} from '../../common/redux/configureStore'
import {setOptionMasterVolume} from '../../common/redux/options-redux'
import {boxShadow3dCss} from '../Keyboard/Keyboard'
import {Knob} from './Knob'
import './VolumeControl.less'

interface IVolumeControlProps {
	masterVolume: number,
	changeMasterVolume: (number) => {type: any}
	color: string
	reportedMasterVolume: number
}

export class VolumeControl extends Component<IVolumeControlProps> {
	public static defaultProps = {
		color: 'gray',
	}

	public render() {
		const {color, reportedMasterVolume} = this.props

		const newColor = Color(color).saturate(reportedMasterVolume / 25).hsl().string()

		return (
			<div className="volume" style={{boxShadow: boxShadow3dCss(4, newColor)}}>
				<div className="label">master volume</div>
				<Knob
					value={this.props.masterVolume}
					onChange={this.props.changeMasterVolume}
					min={0}
					max={1}
					markColor={newColor}
				/>
			</div>
		)
	}
}

export const ConnectedVolumeControl = connect((state: IAppState) => ({
	masterVolume: state.options.masterVolume,
	reportedMasterVolume: Math.floor(state.audio.reportedMasterLevel),
}), (dispatch: Dispatch) => ({
	changeMasterVolume: volume => dispatch(setOptionMasterVolume(volume)),
}))(VolumeControl)
