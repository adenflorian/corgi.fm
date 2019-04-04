import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {
	BasicSamplerParam, selectSampler, setBasicSamplerParam, getConnectionNodeInfo
} from '../../common/redux'
import {IClientAppState} from '../../common/redux'
import {Knob} from '../Knob/Knob'
import {Panel} from '../Panel/Panel'
import {ConnectedNoteSchedulerVisualPlaceholder} from '../WebAudio/SchedulerVisual'
import './BasicSampler.less'
import {
	panToolTip, lpfToolTip, attackToolTip, releaseToolTip, detuneToolTip, gainToolTip
} from '../client-constants';

interface IBasicSamplerProps {
	color: string
	id: string
}

interface IBasicSamplerReduxProps {
	isPlaying: boolean
	pan: number,
	lowPassFilterCutoffFrequency: number,
	attack: number,
	release: number,
	detune: number,
	gain: number,
}

type IBasicSamplerAllProps = IBasicSamplerProps & IBasicSamplerReduxProps & {dispatch: Dispatch}

export class BasicSampler extends React.PureComponent<IBasicSamplerAllProps> {
	public render() {
		const {color, isPlaying} = this.props

		return (
			<React.Fragment>
				<Panel
					className={`${isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
					id={this.props.id}
					color={color}
					saturate={isPlaying}
				>
					<div className="basicSampler">
						<div className="samplerLabel colorize">Piano Sampler</div>

						<div className="knobs">
							<Knob
								min={-1}
								max={1}
								value={this.props.pan}
								onChange={this._dispatchChangeInstrumentParam}
								label="pan"
								onChangeId={BasicSamplerParam.pan}
								tooltip={panToolTip}
							/>
							<Knob
								min={0}
								max={10000}
								curve={2}
								value={this.props.lowPassFilterCutoffFrequency}
								onChange={this._dispatchChangeInstrumentParam}
								label="lpf"
								onChangeId={BasicSamplerParam.lowPassFilterCutoffFrequency}
								tooltip={lpfToolTip}
							/>
							<Knob
								min={0.01}
								max={10}
								curve={3}
								value={this.props.attack}
								onChange={this._dispatchChangeInstrumentParam}
								label="attack"
								onChangeId={BasicSamplerParam.attack}
								tooltip={attackToolTip}
							/>
							<Knob
								min={0.01}
								max={60}
								curve={2}
								value={this.props.release}
								onChange={this._dispatchChangeInstrumentParam}
								label="release"
								onChangeId={BasicSamplerParam.release}
								tooltip={releaseToolTip}
							/>
							<Knob
								min={-100}
								max={100}
								value={this.props.detune}
								onChange={this._dispatchChangeInstrumentParam}
								label="detune"
								onChangeId={BasicSamplerParam.detune}
								tooltip={detuneToolTip}
							/>
							<Knob
								min={0}
								max={1}
								curve={2}
								value={this.props.gain}
								onChange={this._dispatchChangeInstrumentParam}
								label="gain"
								onChangeId={BasicSamplerParam.gain}
								tooltip={gainToolTip}
							/>
						</div>
					</div>
				</Panel>
				<ConnectedNoteSchedulerVisualPlaceholder id={this.props.id} />
			</React.Fragment>
		)
	}

	private readonly _dispatchChangeInstrumentParam = (paramType: BasicSamplerParam, value: any) =>
		this.props.dispatch(setBasicSamplerParam(this.props.id, paramType, value))
}

export const ConnectedBasicSampler = connect(
	(state: IClientAppState, {id}: IBasicSamplerProps): IBasicSamplerReduxProps => {
		const samplerState = selectSampler(state.room, id)

		return {
			isPlaying: getConnectionNodeInfo(samplerState.type)
				.selectIsPlaying(state.room, id),
			pan: samplerState.pan,
			lowPassFilterCutoffFrequency: samplerState.lowPassFilterCutoffFrequency,
			attack: samplerState.attack,
			release: samplerState.release,
			detune: samplerState.detune,
			gain: samplerState.gain,
		}
	},
)(BasicSampler)
