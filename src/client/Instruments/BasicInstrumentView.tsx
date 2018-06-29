import {Component} from 'react'
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
import {audioContext, preFx} from '../setup-audio-context'
import {Knob} from '../Volume/Knob'
import {ClientId} from '../websocket-listeners'
import {BasicInstrument} from './BasicInstrument'
import './BasicInstrumentView.less'
import SawWave from './SawWave.svg'
import SineWave from './SineWave.svg'
import SquareWave from './SquareWave.svg'

export type MidiNotes = IMidiNote[]

interface IBasicInstrumentViewProps {
	color?: string
	rawMidiNotes?: MidiNotes
	ownerId?: ClientId
	pan?: number
	isPlaying?: boolean
	oscillatorType?: OscillatorType
	dispatch?: Dispatch
	instrumentId?: string
	id: string
	lowPassFilterCutoffFrequency?: number
	attack?: number
	release?: number
}

const oscillatorTypes = [
	{type: 'sine', svgPath: SineWave},
	{type: 'square', svgPath: SquareWave},
	{type: 'sawtooth', svgPath: SawWave},
]

export class BasicInstrumentView extends Component<IBasicInstrumentViewProps> {
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
					{/* <div className="label colorize">basic instrument</div> */}

					<Knob
						min={-1}
						max={1}
						value={pan}
						onChange={value => this.props.dispatch(setBasicInstrumentParam(this.props.id, BasicInstrumentParam.pan, value))}
						label="pan"
						markColor="currentColor"
					/>

					<Knob
						min={0}
						max={10000}
						value={this.props.lowPassFilterCutoffFrequency}
						onChange={value =>
							this.props.dispatch(
								setBasicInstrumentParam(this.props.id, BasicInstrumentParam.lowPassFilterCutoffFrequency, value),
							)
						}
						sensitivity={100}
						label="lpf"
						markColor="currentColor"
					/>

					<Knob
						min={0.01}
						max={10}
						value={this.props.attack}
						onChange={value =>
							this.props.dispatch(
								setBasicInstrumentParam(this.props.id, BasicInstrumentParam.attack, value),
							)
						}
						sensitivity={0.1}
						label="attack"
						markColor="currentColor"
					/>

					<Knob
						min={0.01}
						max={60}
						value={this.props.release}
						onChange={value =>
							this.props.dispatch(
								setBasicInstrumentParam(this.props.id, BasicInstrumentParam.release, value),
							)
						}
						sensitivity={1}
						label="release"
						markColor="currentColor"
					/>

					<BasicInstrumentOscillatorTypes
						handleClick={this._handleOscillatorTypeClicked}
						activeType={oscillatorType}
					/>
				</div >
			</div>
		)
	}

	private _handleOscillatorTypeClicked = (type: OscillatorType) => {
		this.props.dispatch(setBasicInstrumentOscillatorType(this.props.instrumentId, type))
	}
}

interface IBasicInstrumentOscillatorTypesProps {
	handleClick: (type: OscillatorType) => void
	activeType: OscillatorType
}

class BasicInstrumentOscillatorTypes extends Component<IBasicInstrumentOscillatorTypesProps> {
	public shouldComponentUpdate(nextProps) {
		if (this.props.activeType !== nextProps.activeType) return true
		return false
	}

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
	return (state: IAppState, props: IBasicInstrumentViewProps) => {
		const connection = selectFirstConnectionByTargetId(state, props.id)
		const rawMidiNotes = connection && getConnectionSourceNotes(state, connection.id)
		const instrumentState = selectInstrument(state, props.id)

		return {
			rawMidiNotes: rawMidiNotes || [],
			isPlaying: rawMidiNotes ? rawMidiNotes.length > 0 : false,
			oscillatorType: instrumentState && instrumentState.oscillatorType,
			instrumentId: instrumentState && instrumentState.id,
			color: connection && getConnectionSourceColor(state, connection.id),
			pan: instrumentState && instrumentState.pan,
			lowPassFilterCutoffFrequency: instrumentState && instrumentState.lowPassFilterCutoffFrequency,
			attack: instrumentState && instrumentState.attack,
			release: instrumentState && instrumentState.release,
		}
	}
}

export const ConnectedBasicInstrumentView = connect(
	makeMapStateToProps,
)(BasicInstrumentView)
