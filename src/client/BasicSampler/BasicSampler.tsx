import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {BasicSamplerParam, selectSampler, setBasicSamplerParam} from '../../common/redux'
import {IClientAppState} from '../../common/redux'
import {
	selectConnectionSourceColorByTargetId, selectConnectionSourceNotesByTargetId,
} from '../../common/redux'
import {Knob} from '../Knob/Knob'
import {Panel} from '../Panel/Panel'
import './BasicSampler.less'

interface IBasicSamplerProps {
	id: string
}

interface IBasicSamplerReduxProps {
	color: string
	isPlaying: boolean
	pan: number,
	lowPassFilterCutoffFrequency: number,
	attack: number,
	release: number,
}

type IBasicSamplerAllProps = IBasicSamplerProps & IBasicSamplerReduxProps & {dispatch: Dispatch}

export class BasicSampler extends React.PureComponent<IBasicSamplerAllProps> {
	public render() {
		const {color, isPlaying} = this.props

		return (
			<Panel
				className={`${isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
				id={this.props.id}
				color={color}
				saturate={isPlaying}
			>
				<div className="basicSampler">

					<div className="samplerLabel colorize">Piano Sampler</div>

					<Knob
						min={-1}
						max={1}
						value={this.props.pan}
						onChange={this._dispatchChangeInstrumentParam}
						label="pan"
						onChangeId={BasicSamplerParam.pan}
					/>

					<Knob
						min={0}
						max={10000}
						curve={2}
						value={this.props.lowPassFilterCutoffFrequency}
						onChange={this._dispatchChangeInstrumentParam}
						label="lpf"
						onChangeId={BasicSamplerParam.lowPassFilterCutoffFrequency}
					/>

					<Knob
						min={0.01}
						max={10}
						curve={3}
						value={this.props.attack}
						onChange={this._dispatchChangeInstrumentParam}
						label="attack"
						onChangeId={BasicSamplerParam.attack}
					/>

					<Knob
						min={0.01}
						max={60}
						curve={2}
						value={this.props.release}
						onChange={this._dispatchChangeInstrumentParam}
						label="release"
						onChangeId={BasicSamplerParam.release}
					/>
				</div>
			</Panel>
		)
	}

	private readonly _dispatchChangeInstrumentParam = (value: any, paramType: BasicSamplerParam) =>
		this.props.dispatch(setBasicSamplerParam(this.props.id, paramType, value))
}

export const ConnectedBasicSampler = connect(
	(state: IClientAppState, {id}: IBasicSamplerProps): IBasicSamplerReduxProps => {
		const samplerState = selectSampler(state.room, id)

		return {
			color: selectConnectionSourceColorByTargetId(state.room, id),
			isPlaying: selectConnectionSourceNotesByTargetId(state.room, id).count() > 0,
			pan: samplerState.pan,
			lowPassFilterCutoffFrequency: samplerState.lowPassFilterCutoffFrequency,
			attack: samplerState.attack,
			release: samplerState.release,
		}
	},
)(BasicSampler)
