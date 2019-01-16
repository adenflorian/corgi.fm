import 'rc-slider/assets/index.css'
import React = require('react')
import {Component} from 'react'
import {connect} from 'react-redux'
import {Action, Dispatch} from 'redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {setOptionMasterVolume} from '../../common/redux/options-redux'
import {colorFunc} from '../../common/shamu-color'
import {Knob} from '../Knob/Knob'
import {Panel} from '../Panel/Panel'
import './VolumeControl.less'

interface IVolumeControlProps {
	color: string
}

interface IVolumeControlReduxProps {
	masterVolume: number,
	reportedMasterVolume: number
}

interface IVolumeControlDispatchProps {
	changeMasterVolume: (number: number) => Action
}

type IVolumeControlAllProps = IVolumeControlProps & IVolumeControlReduxProps & IVolumeControlDispatchProps

export class VolumeControl extends Component<IVolumeControlAllProps> {
	public static defaultProps = {
		color: 'gray',
	}

	public render() {
		const {color, reportedMasterVolume} = this.props

		const newColor = colorFunc(color).saturate(reportedMasterVolume / 25).hsl().string()

		return (
			<Panel className="volume" color={newColor}>
				<div className="label">Master Volume</div>
				<Knob
					value={this.props.masterVolume}
					onChange={this.props.changeMasterVolume}
					min={0}
					max={0.5}
					markColor={newColor}
				/>
			</Panel>
		)
	}
}

export const ConnectedVolumeControl = connect((state: IClientAppState) => ({
	masterVolume: state.options.masterVolume,
	reportedMasterVolume: Math.floor(state.audio.reportedMasterLevel),
}), (dispatch: Dispatch): IVolumeControlDispatchProps => ({
	changeMasterVolume: volume => dispatch(setOptionMasterVolume(volume)),
}))(VolumeControl)
