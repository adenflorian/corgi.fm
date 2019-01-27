import 'rc-slider/assets/index.css'
import {Component} from 'react'
import React = require('react')
import {connect} from 'react-redux'
import {Action, Dispatch} from 'redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {
	selectConnectionSourceColorByTargetId,
} from '../../common/redux/connections-redux'
import {MASTER_AUDIO_OUTPUT_TARGET_ID} from '../../common/redux/node-types'
import {setOptionMasterVolume} from '../../common/redux/options-redux'
import {colorFunc} from '../../common/shamu-color'
import {Knob} from '../Knob/Knob'
import {Panel} from '../Panel/Panel'
import './VolumeControl.less'

interface IVolumeControlReduxProps {
	color: string
	masterVolume: number,
	reportedMasterVolume: number
}

interface IVolumeControlDispatchProps {
	changeMasterVolume: (number: number) => Action
}

type IVolumeControlAllProps = IVolumeControlReduxProps & IVolumeControlDispatchProps

export class VolumeControl extends Component<IVolumeControlAllProps> {
	public static defaultProps = {
		color: 'gray',
	}

	public render() {
		const {color, reportedMasterVolume} = this.props

		const newColor = colorFunc(color).saturate(reportedMasterVolume / 25).hsl().string()

		return (
			<Panel id={MASTER_AUDIO_OUTPUT_TARGET_ID} className="volume" color={newColor}>
				<div className="label">Audio Output</div>
				<Knob
					value={this.props.masterVolume}
					onChange={this.props.changeMasterVolume}
					min={0}
					max={0.5}
					markColor={newColor}
					size={40}
				/>
			</Panel>
		)
	}
}

export const ConnectedVolumeControl = connect(
	(state: IClientAppState): IVolumeControlReduxProps => {
		return {
			color: selectConnectionSourceColorByTargetId(state.room, MASTER_AUDIO_OUTPUT_TARGET_ID),
			masterVolume: state.options.masterVolume,
			reportedMasterVolume: Math.floor(state.audio.reportedMasterLevel),
		}
	},
	(dispatch: Dispatch): IVolumeControlDispatchProps => ({
		changeMasterVolume: volume => dispatch(setOptionMasterVolume(volume)),
	}),
)(VolumeControl)
