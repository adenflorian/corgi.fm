import * as React from 'react'
import {connect} from 'react-redux'
import {IClientAppState} from '../../common/redux/common-redux-types'

interface IBasicSamplerProps {
	id: string
}

interface IBasicSamplerReduxProps {
	isPlaying: boolean
}

type IBasicSamplerAllProps = IBasicSamplerProps & IBasicSamplerReduxProps

export class BasicSampler extends React.PureComponent<IBasicSamplerAllProps> {
	public render() {
		const {isPlaying} = this.props

		return (
			<div className={`container basicSampler ${isPlaying ? 'isPlaying saturate' : 'isNotPlaying'}`} id={this.props.id}>
				hello world, i am a basic sampler
			</div>
		)
	}
}

// export const ConnectedBasicSampler = connect((state: IClientAppState, {id}: IBasicSamplerProps): IBasicSamplerReduxProps => {

// })
