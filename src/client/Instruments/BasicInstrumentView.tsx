import classnames from 'classnames'
import {Component} from 'react'
import * as React from 'react'
import {connect} from 'react-redux'
import ReactSVG from 'react-svg'
import {Dispatch} from 'redux'
import {IMidiNote} from '../../common/MidiNote'
import {createBasicInstrument, selectInstrumentByOwner} from '../../common/redux/basic-instruments-redux'
import {IAppState} from '../../common/redux/configureStore'
import {makeGetMidiOutputByOwner} from '../../common/redux/virtual-keyboard-redux'
import {boxShadow3dCss} from '../Keyboard/Keyboard'
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
	brightColor?: string
	rawMidiNotes?: MidiNotes
	ownerId: ClientId
	pan?: number
	isPlaying?: boolean
	oscillatorType?: OscillatorType
	createBasicInstrument?: () => any
}

export class BasicInstrumentView extends Component<IBasicInstrumentViewProps> {
	public static defaultProps = {
		pan: 0,
		rawMidiNotes: [],
		color: 'gray',
		brightColor: 'lightgray',
	}

	private instrument: BasicInstrument

	constructor(props) {
		super(props)
		props.createBasicInstrument(props.ownerId)
		this.instrument = new BasicInstrument({
			audioContext,
			destination: preFx,
		})
		this.instrument.setPan(props.pan)
	}

	public componentWillUnmount() {
		this.instrument.dispose()
	}

	public render() {
		const {color, brightColor, isPlaying, pan, rawMidiNotes, oscillatorType} = this.props

		this.instrument.setMidiNotes(rawMidiNotes)
		this.instrument.setOscillatorType(oscillatorType)

		return (
			<div
				className={classnames(['basicInstrument', isPlaying ? 'isPlaying' : 'isNotPlaying'])}
				style={{boxShadow: boxShadow3dCss(4, isPlaying ? brightColor : color)}}
			>
				<div className="label">basic instrument</div>
				<Knob min={-1} max={1} value={pan} label="pan" readOnly={true} />
				<div className="oscillatorTypes" style={{color: isPlaying ? brightColor : color}} >
					<ReactSVG path={SineWave} className={oscillatorType === 'sine' ? 'active' : ''} />
					<ReactSVG path={SquareWave} className={oscillatorType === 'square' ? 'active' : ''} />
					<ReactSVG path={SawWave} className={oscillatorType === 'sawtooth' ? 'active' : ''} />
				</div>
			</div >
		)
	}
}

const makeMapStateToProps = () => {
	const getMidiOutputByOwner = makeGetMidiOutputByOwner()

	return (state: IAppState, props: IBasicInstrumentViewProps) => {
		const rawMidiNotes = props.ownerId ? getMidiOutputByOwner(state, props) : []
		const instrumentState = selectInstrumentByOwner(state, props.ownerId)

		return {
			rawMidiNotes,
			isPlaying: rawMidiNotes.length > 0,
			instrumentState: selectInstrumentByOwner(state, props.ownerId),
			oscillatorType: instrumentState && instrumentState.oscillatorType,
		}
	}
}

export const ConnectedBasicInstrumentView = connect(
	makeMapStateToProps,
	(dispatch: Dispatch) => ({
		createBasicInstrument: (ownerId: ClientId) => dispatch(createBasicInstrument(ownerId)),
	}),
)(BasicInstrumentView)
