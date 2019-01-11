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
	selectConnectionSourceColor, selectConnectionSourceNotesByTargetId, selectFirstConnectionByTargetId,
} from '../../common/redux/connections-redux'
import {Knob} from '../Knob/Knob'
import {Panel} from '../Panel'
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

export class BasicInstrumentView
	extends React.PureComponent<IBasicInstrumentViewAllProps> {

	public static defaultProps = {
		color: 'gray',
		pan: 0,
		rawMidiNotes: [],
	}

	public render() {
		const {color, isPlaying, pan, oscillatorType} = this.props

		return (
			<Panel
				className={`${isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
				color={color}
				saturate={isPlaying}
				id={this.props.id}
			>
				<div className="basicInstrument">
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
				</div>
			</Panel>
		)
	}

	private readonly _handleOscillatorTypeClicked = (type: ShamuOscillatorType) => {
		this.props.dispatch(setBasicInstrumentOscillatorType(this.props.id, type))
	}

	private readonly _dispatchChangeInstrumentParam = (value: any, paramType: BasicInstrumentParam) => {
		this.props.dispatch(
			setBasicInstrumentParam(this.props.id, paramType, value),
		)
	}
}

const makeMapStateToProps = () => {
	return (state: IClientAppState, props: IBasicInstrumentViewProps): IBasicInstrumentViewReduxProps => {
		const connection = selectFirstConnectionByTargetId(state.room, props.id)
		const rawMidiNotes = selectConnectionSourceNotesByTargetId(state.room, props.id)
		const instrumentState = selectInstrument(state.room, props.id)

		return {
			rawMidiNotes: rawMidiNotes || [],
			isPlaying: rawMidiNotes ? rawMidiNotes.length > 0 : false,
			oscillatorType: instrumentState.oscillatorType,
			color: connection ? selectConnectionSourceColor(state.room, connection.id) : BasicInstrumentView.defaultProps.color,
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
