import 'rc-slider/assets/index.css'
import React = require('react')
import {Component} from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {selectOwner} from '../../common/redux/clients-redux'
import {IAppState} from '../../common/redux/configureStore'
import {setOptionMasterVolume} from '../../common/redux/options-redux'
import './VolumeControl.less'

interface IVolumeControlProps {
	masterVolume: number,
	changeMasterVolume: (number) => {type: any}
	ownerColor: string
}

export class VolumeControl extends Component<IVolumeControlProps> {
	public render() {
		return (
			<div className="volume">
				<input
					type="range"
					min={0}
					max={1}
					step={0.001}
					value={this.props.masterVolume}
					onChange={this.props.changeMasterVolume}
				/>
			</div>
		)
	}
}

export const ConnectedVolumeControl = connect((state: IAppState) => ({
	masterVolume: state.options.masterVolume,
	ownerColor: selectOwner(state).color,
}), (dispatch: Dispatch) => ({
	changeMasterVolume: volume => dispatch(setOptionMasterVolume(volume.target.value)),
}))(VolumeControl)
