import * as React from 'react'
import {connect} from 'react-redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {
	getConnectionSourceColorByTargetId, selectConnectionSourceNotesByTargetId,
} from '../../common/redux/connections-redux'
import './BasicSampler.less'

interface IBasicSamplerProps {
	id: string
}

interface IBasicSamplerReduxProps {
	color: string
	isPlaying: boolean
}

type IBasicSamplerAllProps = IBasicSamplerProps & IBasicSamplerReduxProps

export class BasicSampler extends React.PureComponent<IBasicSamplerAllProps> {
	public render() {
		const {color, isPlaying} = this.props

		return (
			<div
				className={`container basicSampler ${isPlaying ? 'isPlaying saturate' : 'isNotPlaying'}`}
				id={this.props.id}
				style={{color}}
			>
				<div className="isometricBoxShadow" />
				<div className="inside">
					hello world, i am a basic sampler
				</div>
			</div>
		)
	}
}

export const ConnectedBasicSampler = connect(
	(state: IClientAppState, {id}: IBasicSamplerProps): IBasicSamplerReduxProps => ({
		color: getConnectionSourceColorByTargetId(state.room, id),
		isPlaying: selectConnectionSourceNotesByTargetId(state.room, id).length > 0,
	}),
)(BasicSampler)
