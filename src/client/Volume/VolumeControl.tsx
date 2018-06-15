import Slider from 'rc-slider'
// We can just import Slider or Range to reduce bundle size
// import Slider from 'rc-slider/lib/Slider';
// import Range from 'rc-slider/lib/Range';
import 'rc-slider/assets/index.css'
import React = require('react')
import {Component, Fragment} from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {selectOwner} from '../redux/clients-redux'
import {IAppState} from '../redux/configureStore'
import {setOptionMasterVolume} from '../redux/options-redux'
import './VolumeControl.css'

interface IVolumeControlProps {
	masterVolume: number,
	changeMasterVolume: (number) => {type: any}
	ownerColor: string
}

export class VolumeControl extends Component<IVolumeControlProps> {
	public render() {
		return (
			<Fragment>
				<Slider
					vertical={true}
					min={0}
					max={1}
					step={0.001}
					value={this.props.masterVolume}
					onChange={this.props.changeMasterVolume}
					style={{
						padding: 0,
						position: 'absolute',
					}}
					railStyle={{
						borderRadius: 0,
						width: 16,
						backgroundColor: '#282832',
					}}
					trackStyle={{
						borderRadius: 0,
						width: 16,
						backgroundColor: this.props.ownerColor || 'rgb(120, 120, 120)',
						left: 0,
					}}
					handleStyle={{
						borderRadius: 0,
						width: 16,
						marginLeft: 0,
						border: 'none',
						backgroundColor: 'rgb(120, 120, 120)',
					}}
				/>
			</Fragment>
		)
	}
}

export const ConnectedVolumeControl = connect((state: IAppState) => ({
	masterVolume: state.options.masterVolume,
	ownerColor: selectOwner(state).color,
}), (dispatch: Dispatch) => ({
	changeMasterVolume: volume => dispatch(setOptionMasterVolume(volume)),
}))(VolumeControl)
