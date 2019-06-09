import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IMidiNotes} from '../../common/MidiNote'
import {ShamuOscillatorType} from '../../common/OscillatorTypes'
import {
	BasicSynthesizerParam, getConnectionNodeInfo,
	selectBasicSynthesizer, setBasicSynthesizerOscillatorType,
	setBasicSynthesizerParam,
} from '../../common/redux'
import {IClientAppState} from '../../common/redux'
import {
	adsrValueToString, attackToolTip, decayToolTip, detuneToolTip, detuneValueToString,
	filterAttackToolTip, filterDecayToolTip, filterReleaseToolTip, filterSustainToolTip,
	filterValueToString, gainToolTip, lpfToolTip, panToolTip, panValueToString,
	releaseToolTip, sustainToolTip,
} from '../client-constants'
import {Knob} from '../Knob/Knob'
import {Panel} from '../Panel/Panel'
import {ConnectedNoteSchedulerVisualPlaceholder} from '../WebAudio/SchedulerVisual'
import {BasicSynthesizerOscillatorTypes} from './BasicSynthesizerOscillatorTypes'
import './BasicSynthesizerView.less'

export type MidiNotes = IMidiNotes

type IBasicSynthesizerViewAllProps = IBasicSynthesizerViewProps & IBasicSynthesizerViewReduxProps & {dispatch: Dispatch}

interface IBasicSynthesizerViewProps {
	color: string
	id: string
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
}

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
								defaultValue={0.05}
								onChange={this._dispatchChangeInstrumentParam}
								label="attack"
								onChangeId={BasicSynthesizerParam.attack}
								tooltip={attackToolTip}
								valueString={adsrValueToString}
							/>
							<Knob
								min={0}
								max={30}
								curve={3}
								value={this.props.decay}
								defaultValue={0.25}
								onChange={this._dispatchChangeInstrumentParam}
								label="decay"
								onChangeId={BasicSynthesizerParam.decay}
								tooltip={decayToolTip}
								valueString={adsrValueToString}
							/>
							<Knob
								min={0}
								max={1}
								value={this.props.sustain}
								defaultValue={0.8}
								onChange={this._dispatchChangeInstrumentParam}
								label="sustain"
								onChangeId={BasicSynthesizerParam.sustain}
								tooltip={sustainToolTip}
							/>
							<Knob
								min={0.01}
								max={60}
								curve={2}
								value={this.props.release}
								defaultValue={0.1}
								onChange={this._dispatchChangeInstrumentParam}
								label="release"
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
								label="filterAttack"
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
								label="filterDecay"
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
								label="filterSustain"
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
								label="filterRelease"
								onChangeId={BasicSynthesizerParam.filterRelease}
								tooltip={filterReleaseToolTip}
								valueString={adsrValueToString}
							/>
						</div> */}
						<div className="knobs">
							<Knob
								min={-1}
								max={1}
								value={pan}
								defaultValue={0}
								onChange={this._dispatchChangeInstrumentParam}
								label="pan"
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
								label="lpf"
								onChangeId={BasicSynthesizerParam.lowPassFilterCutoffFrequency}
								tooltip={lpfToolTip}
								valueString={filterValueToString}
							/>
							<Knob
								min={-100}
								max={100}
								value={this.props.fineTuning}
								defaultValue={0}
								onChange={this._dispatchChangeInstrumentParam}
								label="detune"
								onChangeId={BasicSynthesizerParam.fineTuning}
								tooltip={detuneToolTip}
								valueString={detuneValueToString}
							/>
							<Knob
								min={0}
								max={1}
								value={this.props.gain}
								defaultValue={0.5}
								onChange={this._dispatchChangeInstrumentParam}
								label="gain"
								onChangeId={BasicSynthesizerParam.gain}
								tooltip={gainToolTip}
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
		}
	},
)(
	BasicSynthesizerView as React.ComponentClass<IBasicSynthesizerViewAllProps>,
) as React.ComponentClass<IBasicSynthesizerViewProps>
