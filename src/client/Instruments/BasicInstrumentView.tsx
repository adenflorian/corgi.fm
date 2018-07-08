import * as React from 'react'
import {connect} from 'react-redux'
import ReactSVG from 'react-svg'
import {Dispatch} from 'redux'
import {IMidiNote} from '../../common/MidiNote'
import {
	BasicInstrumentParam, selectInstrument, setBasicInstrumentOscillatorType, setBasicInstrumentParam,
} from '../../common/redux/basic-instruments-redux'
import {IAppState} from '../../common/redux/configureStore'
import {
	getConnectionSourceColor, getConnectionSourceNotes, selectFirstConnectionByTargetId,
} from '../../common/redux/connections-redux'
import {Knob} from '../Knob/Knob'
import {audioContext, preFx} from '../setup-audio-context'
import {BasicInstrument} from './BasicInstrument'
import './BasicInstrumentView.less'
import SawWave from './SawWave.svg'
import SineWave from './SineWave.svg'
import SquareWave from './SquareWave.svg'

export type MidiNotes = IMidiNote[]

interface IBasicInstrumentViewProps {
	color: string
	rawMidiNotes: MidiNotes
	pan: number
	isPlaying: boolean
	oscillatorType: OscillatorType
	dispatch?: Dispatch
	lowPassFilterCutoffFrequency: number
	attack: number
	release: number
	id: string
}

const oscillatorTypes = [
	{type: 'sine', svgPath: SineWave},
	{type: 'square', svgPath: SquareWave},
	{type: 'sawtooth', svgPath: SawWave},
]

export class BasicInstrumentView extends React.PureComponent<IBasicInstrumentViewProps> {
	public static defaultProps = {
		pan: 0,
		rawMidiNotes: [],
		color: 'gray',
	}

	private instrument: BasicInstrument

	constructor(props: IBasicInstrumentViewProps) {
		super(props)
		this.instrument = new BasicInstrument({
			audioContext,
			destination: preFx,
			voiceCount: 9,
			oscillatorType: props.oscillatorType,
		})
		this.instrument.setPan(props.pan)
	}

	public componentWillUnmount() {
		this.instrument.dispose()
	}

	public render() {
		const {color, isPlaying, pan, rawMidiNotes, oscillatorType} = this.props

		this.instrument.setMidiNotes(rawMidiNotes)
		this.instrument.setOscillatorType(oscillatorType)
		this.instrument.setPan(pan)
		this.instrument.setLowPassFilterCutoffFrequency(this.props.lowPassFilterCutoffFrequency)
		this.instrument.setAttack(this.props.attack)
		this.instrument.setRelease(this.props.release)

		return (
			<div
				className={`container basicInstrument ${isPlaying ? 'isPlaying saturate' : 'isNotPlaying'}`}
				style={{color}}
			>
				<div className="isometricBoxShadow"></div>
				<div
					id={this.props.id}
					className="basicInstrument"
				>
					<BasicInstrumentOscillatorTypes
						handleClick={this._handleOscillatorTypeClicked}
						activeType={oscillatorType}
					/>

					<Knob
						min={-1}
						max={1}
						value={pan}
						onChange={this._dispatchChangeInstrumentParam}
						label="pan"
						onChangeId={BasicInstrumentParam.pan}
					/>

					<Knob
						min={0}
						max={10000}
						curve={2}
						value={this.props.lowPassFilterCutoffFrequency}
						onChange={this._dispatchChangeInstrumentParam}
						label="lpf"
						onChangeId={BasicInstrumentParam.lowPassFilterCutoffFrequency}
					/>

					<Knob
						min={0.01}
						max={10}
						curve={3}
						value={this.props.attack}
						onChange={this._dispatchChangeInstrumentParam}
						label="attack"
						onChangeId={BasicInstrumentParam.attack}
					/>

					<Knob
						min={0.01}
						max={60}
						curve={2}
						value={this.props.release}
						onChange={this._dispatchChangeInstrumentParam}
						label="release"
						onChangeId={BasicInstrumentParam.release}
					/>
				</div >
			</div>
		)
	}

	private _handleOscillatorTypeClicked = (type: OscillatorType) => {
		this.props.dispatch(setBasicInstrumentOscillatorType(this.props.id, type))
	}

	private _dispatchChangeInstrumentParam = (value: any, paramType: BasicInstrumentParam) => {
		this.props.dispatch(
			setBasicInstrumentParam(this.props.id, paramType, value),
		)
	}
}

interface IBasicInstrumentOscillatorTypesProps {
	handleClick: (type: OscillatorType) => void
	activeType: OscillatorType
}

class BasicInstrumentOscillatorTypes extends React.PureComponent<IBasicInstrumentOscillatorTypesProps> {
	public render() {
		const {activeType, handleClick} = this.props

		return (
			<div className="oscillatorTypes">
				{oscillatorTypes.map(({type, svgPath}) =>
					<div key={type} onClick={handleClick.bind(undefined, type)}>
						<ReactSVG
							path={svgPath}
							className={activeType === type ? 'active colorize' : undefined}
						/>
					</div>,
				)}
			</div>
		)
	}
}

const makeMapStateToProps = () => {
	return (state: IAppState, props: IConnectedBasicInstrumentViewProps): IBasicInstrumentViewProps => {
		const connection = selectFirstConnectionByTargetId(state, props.id)
		const rawMidiNotes = connection && getConnectionSourceNotes(state, connection.id)
		const instrumentState = selectInstrument(state, props.id)

		return {
			rawMidiNotes: rawMidiNotes || [],
			isPlaying: rawMidiNotes ? rawMidiNotes.length > 0 : false,
			oscillatorType: instrumentState.oscillatorType,
			color: connection && getConnectionSourceColor(state, connection.id),
			pan: instrumentState.pan,
			lowPassFilterCutoffFrequency: instrumentState.lowPassFilterCutoffFrequency,
			attack: instrumentState.attack,
			release: instrumentState.release,
			id: props.id,
		}
	}
}

interface IConnectedBasicInstrumentViewProps {
	id: string
}

export const ConnectedBasicInstrumentView = connect(
	makeMapStateToProps,
)(BasicInstrumentView)
