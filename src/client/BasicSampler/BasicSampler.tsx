import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {BasicSamplerParam, selectSampler, setBasicSamplerParam} from '../../common/redux/basic-sampler-redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {
	getConnectionSourceColorByTargetId, selectConnectionSourceNotesByTargetId,
} from '../../common/redux/connections-redux'
import {Knob} from '../Knob/Knob'
import './BasicSampler.less'

interface IBasicSamplerProps {
	id: string
}

interface IBasicSamplerReduxProps {
	color: string
	isPlaying: boolean
	lowPassFilterCutoffFrequency: number
}

type IBasicSamplerAllProps = IBasicSamplerProps & IBasicSamplerReduxProps & {dispatch: Dispatch}

export class BasicSampler extends React.PureComponent<IBasicSamplerAllProps> {
	public render() {
		const {id, color, isPlaying, lowPassFilterCutoffFrequency} = this.props

		return (
			<div
				className={`container basicSampler ${isPlaying ? 'isPlaying saturate' : 'isNotPlaying'}`}
				id={id}
				style={{color}}
			>
				<div className="isometricBoxShadow" />
				<div className="inside">
					hello world, i am a basic sampler

					<Knob
						min={0}
						max={10000}
						curve={2}
						value={lowPassFilterCutoffFrequency}
						onChange={this._dispatchChangeInstrumentParam}
						label="lpf"
						onChangeId={BasicSamplerParam.lowPassFilterCutoffFrequency}
					/>
				</div>
			</div>
		)
	}

	private readonly _dispatchChangeInstrumentParam = (value: any, paramType: BasicSamplerParam) =>
		this.props.dispatch(setBasicSamplerParam(this.props.id, paramType, value))
}

export const ConnectedBasicSampler = connect(
	(state: IClientAppState, {id}: IBasicSamplerProps): IBasicSamplerReduxProps => ({
		color: getConnectionSourceColorByTargetId(state.room, id),
		isPlaying: selectConnectionSourceNotesByTargetId(state.room, id).length > 0,
		lowPassFilterCutoffFrequency: selectSampler(state.room, id).lowPassFilterCutoffFrequency,
	}),
)(BasicSampler)
