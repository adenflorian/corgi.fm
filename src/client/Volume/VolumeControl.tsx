import {stripIndents} from 'common-tags'
import 'rc-slider/assets/index.css'
import React = require('react')
import {Component} from 'react'
import {connect} from 'react-redux'
import {Action, Dispatch} from 'redux'
import {ConnectionNodeType} from '../../common/common-types'
import {setOptionMasterVolume} from '../../common/redux'
import {getConnectionNodeInfo, IClientAppState} from '../../common/redux'
import {MASTER_AUDIO_OUTPUT_TARGET_ID} from '../../common/redux'
import {percentageValueString} from '../client-constants'
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
			<Panel
				id={MASTER_AUDIO_OUTPUT_TARGET_ID}
				className="volume"
				color={color}
				saturate={isPlaying}
				label="Audio Out"
			>
				<Knob
					value={this.props.masterVolume}
					defaultValue={0.1}
					onChange={this.props.changeMasterVolume}
					min={0}
					max={0.5}
					markColor={color}
					size={80}
					tooltip={stripIndents`Local master volume
						Will only control the volume for you
						It won't affect other users`}
					label=""
					valueString={percentageValueString}
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
