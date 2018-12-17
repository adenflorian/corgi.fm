import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IMidiNote} from '../../common/MidiNote'
import {ShamuOscillatorType} from '../../common/OscillatorTypes'
import {
	BasicInstrumentParam, selectInstrument, setBasicInstrumentOscillatorType, setBasicInstrumentParam,
} from '../../common/redux/basic-instruments-redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {
	getConnectionSourceColor, getConnectionSourceNotes, selectFirstConnectionByTargetId,
} from '../../common/redux/connections-redux'
import {audioContext, preFx} from '../../common/setup-audio-context'
import {Knob} from '../Knob/Knob'
import {BasicInstrument} from './BasicInstrument'
import {BasicInstrumentOscillatorTypes} from './BasicInstrumentOscillatorTypes'
import './BasicInstrumentView.less'

export type MidiNotes = IMidiNote[]

type IBasicInstrumentViewAllProps = IBasicInstrumentViewProps & IBasicInstrumentViewReduxProps & {dispatch: Dispatch}

interface IBasicInstrumentViewProps {
	id: string
}

interface IBasicInstrumentViewReduxProps {
	color: string
	rawMidiNotes: MidiNotes
	pan: number
	isPlaying: boolean
	oscillatorType: ShamuOscillatorType
	lowPassFilterCutoffFrequency: number
	attack: number
	release: number
}

function makeInstrument(props: IBasicInstrumentViewAllProps) {
	const instrument = new BasicInstrument({
		audioContext,
		destination: preFx,
		voiceCount: 9,
		oscillatorType: props.oscillatorType,
	})
	instrument.setPan(props.pan)
	return instrument
}

export class BasicInstrumentView
	extends React.PureComponent<IBasicInstrumentViewAllProps> {

	public static defaultProps = {
		color: 'gray',
		pan: 0,
		rawMidiNotes: [],
	}

	private instrument: BasicInstrument

	constructor(props: IBasicInstrumentViewAllProps) {
		super(props)
		this.instrument = makeInstrument(props)
	}

	public componentDidUpdate(prevProps: IBasicInstrumentViewAllProps) {
		if (prevProps.id !== this.props.id) {
			this.instrument.dispose()
			this.instrument = makeInstrument(this.props)
		}
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
				style={{bottom: -12, color}}
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

	private _handleOscillatorTypeClicked = (type: ShamuOscillatorType) => {
		this.props.dispatch(setBasicInstrumentOscillatorType(this.props.id, type))
	}

	private _dispatchChangeInstrumentParam = (value: any, paramType: BasicInstrumentParam) => {
		this.props.dispatch(
			setBasicInstrumentParam(this.props.id, paramType, value),
		)
	}
}

const makeMapStateToProps = () => {
	return (state: IClientAppState, props: IBasicInstrumentViewProps): IBasicInstrumentViewReduxProps => {
		const connection = selectFirstConnectionByTargetId(state.room, props.id)
		const rawMidiNotes = connection && getConnectionSourceNotes(state.room, connection.id)
		const instrumentState = selectInstrument(state.room, props.id)

		return {
			rawMidiNotes: rawMidiNotes || [],
			isPlaying: rawMidiNotes ? rawMidiNotes.length > 0 : false,
			oscillatorType: instrumentState.oscillatorType,
			color: connection ? getConnectionSourceColor(state.room, connection.id) : BasicInstrumentView.defaultProps.color,
			pan: instrumentState.pan,
			lowPassFilterCutoffFrequency: instrumentState.lowPassFilterCutoffFrequency,
			attack: instrumentState.attack,
			release: instrumentState.release,
		}
	}
}

export const ConnectedBasicInstrumentView = connect(
	makeMapStateToProps,
)(
	BasicInstrumentView as React.ComponentClass<IBasicInstrumentViewAllProps>,
) as React.ComponentClass<IBasicInstrumentViewProps>
