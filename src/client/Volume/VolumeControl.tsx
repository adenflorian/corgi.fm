import 'rc-slider/assets/index.css'
import React = require('react')
import {Component} from 'react'
import {connect} from 'react-redux'
import {Action, Dispatch} from 'redux'
import {ConnectionNodeType} from '../../common/common-types'
import {getConnectionNodeInfo, IClientAppState} from '../../common/redux'
import {setOptionMasterVolume} from '../../common/redux'
import {MASTER_AUDIO_OUTPUT_TARGET_ID} from '../../common/redux'
import {Knob} from '../Knob/Knob'
import {Panel} from '../Panel/Panel'
import './VolumeControl.less'

interface IVolumeControlProps {
	color: string
}

interface IVolumeControlReduxProps {
	isPlaying: boolean,
	masterVolume: number,
}

interface IVolumeControlDispatchProps {
	changeMasterVolume: (_: any, number: number) => Action
}

type IVolumeControlAllProps = IVolumeControlProps & IVolumeControlReduxProps & IVolumeControlDispatchProps

export class VolumeControl extends Component<IVolumeControlAllProps> {
	public render() {
		const {color, isPlaying} = this.props

		return (
			<Panel id={MASTER_AUDIO_OUTPUT_TARGET_ID} className="volume" color={color} saturate={isPlaying}>
				<div
					className="volume-label colorize largeFont"
					title="will only change the volume for you, it won't affect other users"
				>
					Local Audio Output
				</div>
				<Knob
					value={this.props.masterVolume}
					onChange={this.props.changeMasterVolume}
					min={0}
					max={0.5}
					markColor={color}
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
			isPlaying: getConnectionNodeInfo(ConnectionNodeType.audioOutput)
				.selectIsPlaying(state.room, MASTER_AUDIO_OUTPUT_TARGET_ID),
		}
	},
	(dispatch: Dispatch): IVolumeControlDispatchProps => ({
		changeMasterVolume: (_, volume) => dispatch(setOptionMasterVolume(volume)),
	}),
)(VolumeControl)
