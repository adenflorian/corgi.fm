import React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {
	allBuiltInBQFilterTypes, BuiltInBQFilterType,
} from '@corgifm/common/OscillatorTypes'
import {ConnectionNodeType} from '@corgifm/common/common-types'
import {
	IClientAppState, BasicSamplerParam, getConnectionNodeInfo, selectSampler,
	basicSamplerActions,
} from '@corgifm/common/redux'
import {
	adsrValueToString, attackToolTip, decayToolTip, detuneToolTip,
	detuneValueToString, filterToolTip, filterValueToString, gainToolTip,
	panToolTip, panValueToString, percentageValueString, releaseToolTip,
	sustainToolTip,
} from '../client-constants'
import {Knob} from '../Knob/Knob'
import {KnobSnapping} from '../Knob/KnobSnapping'
import {Panel} from '../Panel/Panel'
import {
	ConnectedNoteSchedulerVisualPlaceholder,
} from '../WebAudio/SchedulerVisual'
import './BasicSampler.less'
import {Samples} from './Samples'

interface Props {
	color: string
	id: Id
}

interface ReduxProps {
	isPlaying: boolean
	pan: number
	lowPassFilterCutoffFrequency: number
	attack: number
	decay: number
	sustain: number
	release: number
	detune: number
	gain: number
	filterType: BuiltInBQFilterType
}

type AllProps = Props & ReduxProps & {dispatch: Dispatch}

const name = getConnectionNodeInfo(ConnectionNodeType.basicSampler).typeName

export class BasicSampler extends React.PureComponent<AllProps> {
	public render() {
		const {id, color, isPlaying} = this.props

		return (
			<React.Fragment>
				<Panel
					className={`${isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
					id={this.props.id}
					color={color}
					saturate={isPlaying}
					label={name}
				>
					<div className="basicSampler">
						<Samples samplerId={id} />
						<div className="controls">
							<div className="knobs">
								<Knob
									min={0}
									max={10}
									curve={3}
									value={this.props.attack}
									defaultValue={0.01}
									onChange={this._dispatchChangeInstrumentParam}
									label="Attack"
									onChangeId={BasicSamplerParam.attack}
									tooltip={attackToolTip}
									valueString={adsrValueToString}
								/>
								<Knob
									min={0}
									max={30}
									curve={3}
									value={this.props.decay}
									defaultValue={0}
									onChange={this._dispatchChangeInstrumentParam}
									label="Decay"
									onChangeId={BasicSamplerParam.decay}
									tooltip={decayToolTip}
									valueString={adsrValueToString}
								/>
								<Knob
									min={0}
									max={1}
									value={this.props.sustain}
									defaultValue={1}
									onChange={this._dispatchChangeInstrumentParam}
									label="Sustain"
									onChangeId={BasicSamplerParam.sustain}
									tooltip={sustainToolTip}
									valueString={adsrValueToString}
								/>
								<Knob
									min={0.001}
									max={60}
									curve={2}
									value={this.props.release}
									defaultValue={1}
									onChange={this._dispatchChangeInstrumentParam}
									label="Release"
									onChangeId={BasicSamplerParam.release}
									tooltip={releaseToolTip}
									valueString={adsrValueToString}
								/>
							</div>
							<div className="knobs">
								<Knob
									min={-1}
									max={1}
									value={this.props.pan}
									defaultValue={0}
									onChange={this._dispatchChangeInstrumentParam}
									label="Pan"
									onChangeId={BasicSamplerParam.pan}
									tooltip={panToolTip}
									valueString={panValueToString}
								/>
								<Knob
									min={0}
									max={20000}
									curve={2}
									value={this.props.lowPassFilterCutoffFrequency}
									defaultValue={20000}
									onChange={this._dispatchChangeInstrumentParam}
									label="Filter"
									onChangeId={BasicSamplerParam.lowPassFilterCutoffFrequency}
									tooltip={filterToolTip}
									valueString={filterValueToString}
								/>
								<KnobSnapping
									label="Filter Type"
									value={this.props.filterType}
									defaultIndex={0}
									onChange={this._dispatchChangeInstrumentParam}
									onChangeId={BasicSamplerParam.filterType}
									tooltip="So many filters..."
									possibleValues={allBuiltInBQFilterTypes}
								/>
								<Knob
									min={-100}
									max={100}
									value={this.props.detune}
									defaultValue={0}
									onChange={this._dispatchChangeInstrumentParam}
									label="Detune"
									onChangeId={BasicSamplerParam.detune}
									tooltip={detuneToolTip}
									valueString={detuneValueToString}
								/>
								<Knob
									min={0}
									max={1}
									curve={2}
									value={this.props.gain}
									defaultValue={0.5}
									onChange={this._dispatchChangeInstrumentParam}
									label="Gain"
									onChangeId={BasicSamplerParam.gain}
									tooltip={gainToolTip}
									valueString={percentageValueString}
								/>
							</div>
						</div>
					</div>
				</Panel>
				<ConnectedNoteSchedulerVisualPlaceholder id={this.props.id} />
			</React.Fragment>
		)
	}

	private readonly _dispatchChangeInstrumentParam =
	(paramType: BasicSamplerParam, value: any) =>
		this.props.dispatch(
			basicSamplerActions.setParam(this.props.id, paramType, value))
}

export const ConnectedBasicSampler = connect(
	(state: IClientAppState, {id}: Props): ReduxProps => {
		const samplerState = selectSampler(state.room, id)

		return {
			isPlaying: getConnectionNodeInfo(samplerState.type)
				.selectIsPlaying(state.room, id),
			pan: samplerState.pan,
			lowPassFilterCutoffFrequency: samplerState.lowPassFilterCutoffFrequency,
			attack: samplerState.attack,
			decay: samplerState.decay,
			sustain: samplerState.sustain,
			release: samplerState.release,
			detune: samplerState.detune,
			gain: samplerState.gain,
			filterType: samplerState.filterType,
		}
	},
)(BasicSampler)
