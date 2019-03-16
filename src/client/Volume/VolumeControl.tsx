import 'rc-slider/assets/index.css'
import {Component} from 'react'
import React = require('react')
import {connect} from 'react-redux'
import {Action, Dispatch} from 'redux'
import {IClientAppState} from '../../common/redux'
import {MASTER_AUDIO_OUTPUT_TARGET_ID} from '../../common/redux'
import {setOptionMasterVolume} from '../../common/redux'
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
	changeMasterVolume: (_: any, number: number) => Action
}

type IVolumeControlAllProps = IVolumeControlProps & IVolumeControlReduxProps & IVolumeControlDispatchProps

export class VolumeControl extends Component<IVolumeControlAllProps> {
	public render() {
		const {color, reportedMasterVolume} = this.props

		const newColor = colorFunc(color).saturate(reportedMasterVolume / 25).hsl().string()

		return (
			<Panel id={MASTER_AUDIO_OUTPUT_TARGET_ID} className="volume" color={newColor}>
				<div
					className="volume-label"
					title="will only change the volume for you, it won't affect other users"
				>
					Local Audio Output
				</div>
				<Knob
					value={this.props.masterVolume}
					onChange={this.props.changeMasterVolume}
					min={0}
					max={0.5}
					markColor={newColor}
					size={56}
				/>
			</Panel>
		)
	}
}

export const ConnectedVolumeControl = connect(
	(state: IClientAppState): IVolumeControlReduxProps => {
		return {
			masterVolume: state.options.masterVolume,
			reportedMasterVolume: Math.floor(state.audio.reportedMasterLevel),
		}
	},
	(dispatch: Dispatch): IVolumeControlDispatchProps => ({
		changeMasterVolume: (_, volume) => dispatch(setOptionMasterVolume(volume)),
	}),
)(VolumeControl)
