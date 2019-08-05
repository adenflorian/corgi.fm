import {List} from 'immutable'
import React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IMidiNotes} from '@corgifm/common/MidiNote'
import {allBuiltInBQFilterTypes, BuiltInBQFilterType, LfoOscillatorType, ShamuOscillatorType} from '@corgifm/common/OscillatorTypes'
import {
	BasicSynthesizerParam, getConnectionNodeInfo,
	selectBasicSynthesizer, setBasicSynthesizerOscillatorType,
	setBasicSynthesizerParam, SynthLfoTarget, IClientAppState,
} from '@corgifm/common/redux'
import {
	adsrValueToString, attackToolTip, decayToolTip, detuneToolTip, detuneValueToString,
	filterToolTip, filterValueToString, gainToolTip, lfoRateValueToString,
	panToolTip, panValueToString, percentageValueString, releaseToolTip, sustainToolTip,
} from '../client-constants'
import {Knob} from '../Knob/Knob'
import {KnobSnapping} from '../Knob/KnobSnapping'
import {Panel} from '../Panel/Panel'
import {ConnectedNoteSchedulerVisualPlaceholder} from '../WebAudio/SchedulerVisual'
import {BasicSynthesizerOscillatorTypes} from './BasicSynthesizerOscillatorTypes'
import './BasicSynthesizerView.less'

export type MidiNotes = IMidiNotes

type IBasicSynthesizerViewAllProps = IBasicSynthesizerViewProps & IBasicSynthesizerViewReduxProps & {dispatch: Dispatch}

interface IBasicSynthesizerViewProps {
	color: string
	id: Id
}

interface IBasicSynthesizerViewReduxProps {
	pan: number
	isPlaying: boolean
	oscillatorType: ShamuOscillatorType
	lowPassFilterCutoffFrequency: number
	attack: number
	decay: number
	sustain: number
	release: number
	filterAttack: number
	filterDecay: number
	filterSustain: number
	filterRelease: number
	fineTuning: number
	gain: number
	lfoRate: number
	lfoAmount: number
	lfoTarget: SynthLfoTarget
	lfoWave: LfoOscillatorType
	filterType: BuiltInBQFilterType
}

const lfoWaveTypes = List<LfoOscillatorType>([
	LfoOscillatorType.sine,
	LfoOscillatorType.sawtooth,
	LfoOscillatorType.reverseSawtooth,
	LfoOscillatorType.square,
	LfoOscillatorType.triangle,
])

const lfoTargets = List<SynthLfoTarget>([
	SynthLfoTarget.Gain,
	SynthLfoTarget.Pan,
	SynthLfoTarget.Filter,
])

export class BasicSynthesizerView
	extends React.PureComponent<IBasicSynthesizerViewAllProps> {
	public static defaultProps = {
		pan: 0,
	}

	public render() {
		const {color, isPlaying, pan, oscillatorType} = this.props

		return (
			<React.Fragment>
				<Panel
					className={`${isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
					color={color}
					saturate={isPlaying}
					id={this.props.id}
					label="Basic Synthesizer"
				>
					<div className="basicSynthesizer" title="Basic Synthesizer">
						<BasicSynthesizerOscillatorTypes
							handleClick={this._handleOscillatorTypeClicked}
							activeType={oscillatorType}
						/>
						<div className="knobs">
							<Knob
								min={0}
								max={10}
								curve={3}
								value={this.props.attack}
								defaultValue={0.01}
								onChange={this._dispatchChangeInstrumentParam}
								label="Attack"
								onChangeId={BasicSynthesizerParam.attack}
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
								onChangeId={BasicSynthesizerParam.decay}
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
								onChangeId={BasicSynthesizerParam.sustain}
								tooltip={sustainToolTip}
							/>
							<Knob
								min={0.001}
								max={60}
								curve={2}
								value={this.props.release}
								defaultValue={1}
								onChange={this._dispatchChangeInstrumentParam}
								label="Release"
								onChangeId={BasicSynthesizerParam.release}
								tooltip={releaseToolTip}
								valueString={adsrValueToString}
							/>
						</div>
						{/* <div className="knobs">
							<Knob
								min={0}
								max={10}
								curve={3}
								value={this.props.filterAttack}
								defaultValue={0.05}
								onChange={this._dispatchChangeInstrumentParam}
								label="FilterAttack"
								onChangeId={BasicSynthesizerParam.filterAttack}
								tooltip={filterAttackToolTip}
								valueString={adsrValueToString}
							/>
							<Knob
								min={0}
								max={30}
								curve={3}
								value={this.props.filterDecay}
								defaultValue={0.25}
								onChange={this._dispatchChangeInstrumentParam}
								label="FilterDecay"
								onChangeId={BasicSynthesizerParam.filterDecay}
								tooltip={filterDecayToolTip}
								valueString={adsrValueToString}
							/>
							<Knob
								min={0}
								max={1}
								value={this.props.filterSustain}
								defaultValue={0.8}
								onChange={this._dispatchChangeInstrumentParam}
								label="FilterSustain"
								onChangeId={BasicSynthesizerParam.filterSustain}
								tooltip={filterSustainToolTip}
							/>
							<Knob
								min={0.01}
								max={60}
								curve={2}
								value={this.props.filterRelease}
								defaultValue={0.1}
								onChange={this._dispatchChangeInstrumentParam}
								label="FilterRelease"
								onChangeId={BasicSynthesizerParam.filterRelease}
								tooltip={filterReleaseToolTip}
								valueString={adsrValueToString}
							/>
						</div> */}
						<div className="knobs">
							<Knob
								min={0}
								max={32}
								curve={3}
								value={this.props.lfoRate}
								defaultValue={0}
								onChange={this._dispatchChangeInstrumentParam}
								label="Rate"
								onChangeId={BasicSynthesizerParam.lfoRate}
								tooltip="how fast it wobble"
								valueString={lfoRateValueToString}
							/>
							{/* <KnobSnapping
								value={this.props.lfoRate}
								defaultIndex={rateValues.indexOf(1 / 4)}
								onChange={this._dispatchChangeInstrumentParam}
								label="Rate"
								onChangeId={BasicSynthesizerParam.lfoRate}
								tooltip={'how fast it wobble'}
								valueString={seqRateValueToString}
								possibleValues={rateValues}
							/> */}
							<Knob
								min={0}
								max={1}
								value={this.props.lfoAmount}
								defaultValue={0.1}
								onChange={this._dispatchChangeInstrumentParam}
								label="Amount"
								onChangeId={BasicSynthesizerParam.lfoAmount}
								tooltip="how big it wobble"
								valueString={percentageValueString}
							/>
							<KnobSnapping
								value={this.props.lfoWave}
								defaultIndex={0}
								onChange={this._dispatchChangeInstrumentParam}
								label="Wave"
								onChangeId={BasicSynthesizerParam.lfoWave}
								tooltip="the shape of the wobble"
								possibleValues={lfoWaveTypes}
							/>
							<KnobSnapping
								value={this.props.lfoTarget}
								defaultIndex={0}
								onChange={this._dispatchChangeInstrumentParam}
								label="Target"
								onChangeId={BasicSynthesizerParam.lfoTarget}
								tooltip="what it wobbles"
								possibleValues={lfoTargets}
							/>
						</div>
						<div className="knobs">
							<Knob
								min={-1}
								max={1}
								value={pan}
								defaultValue={0}
								onChange={this._dispatchChangeInstrumentParam}
								label="Pan"
								onChangeId={BasicSynthesizerParam.pan}
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
								onChangeId={BasicSynthesizerParam.lowPassFilterCutoffFrequency}
								tooltip={filterToolTip}
								valueString={filterValueToString}
							/>
							<KnobSnapping
								label="Filter Type"
								value={this.props.filterType}
								defaultIndex={0}
								onChange={this._dispatchChangeInstrumentParam}
								onChangeId={BasicSynthesizerParam.filterType}
								tooltip="So many filters..."
								possibleValues={allBuiltInBQFilterTypes}
							/>
							<Knob
								min={-100}
								max={100}
								value={this.props.fineTuning}
								defaultValue={0}
								onChange={this._dispatchChangeInstrumentParam}
								label="Detune"
								onChangeId={BasicSynthesizerParam.fineTuning}
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
								onChangeId={BasicSynthesizerParam.gain}
								tooltip={gainToolTip}
								valueString={percentageValueString}
							/>
						</div>
					</div>
				</Panel>
				<ConnectedNoteSchedulerVisualPlaceholder id={this.props.id} />
			</React.Fragment>
		)
	}

	private readonly _handleOscillatorTypeClicked = (type: ShamuOscillatorType) => {
		this.props.dispatch(setBasicSynthesizerOscillatorType(this.props.id, type))
	}

	private readonly _dispatchChangeInstrumentParam = (paramType: BasicSynthesizerParam, value: any) => {
		this.props.dispatch(
			setBasicSynthesizerParam(this.props.id, paramType, value),
		)
	}
}

export const ConnectedBasicSynthesizerView = connect(
	(state: IClientAppState, props: IBasicSynthesizerViewProps): IBasicSynthesizerViewReduxProps => {
		const instrumentState = selectBasicSynthesizer(state.room, props.id)

		return {
			isPlaying: getConnectionNodeInfo(instrumentState.type)
				.selectIsPlaying(state.room, props.id),
			oscillatorType: instrumentState.oscillatorType,
			pan: instrumentState.pan,
			lowPassFilterCutoffFrequency: instrumentState.lowPassFilterCutoffFrequency,
			attack: instrumentState.attack,
			decay: instrumentState.decay,
			sustain: instrumentState.sustain,
			release: instrumentState.release,
			filterAttack: instrumentState.filterAttack,
			filterDecay: instrumentState.filterDecay,
			filterSustain: instrumentState.filterSustain,
			filterRelease: instrumentState.filterRelease,
			fineTuning: instrumentState.fineTuning,
			gain: instrumentState.gain,
			lfoRate: instrumentState.lfoRate,
			lfoAmount: instrumentState.lfoAmount,
			lfoTarget: instrumentState.lfoTarget,
			lfoWave: instrumentState.lfoWave,
			filterType: instrumentState.filterType,
		}
	},
)(
	BasicSynthesizerView as React.ComponentClass<IBasicSynthesizerViewAllProps>,
) as React.ComponentClass<IBasicSynthesizerViewProps>
