import classnames from 'classnames'
import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import ReactSVG from 'react-svg'
import {IMidiNote} from '../../common/MidiNote'
import {IAppState} from '../../common/redux/configureStore'
import {selectMidiOutput} from '../../common/redux/virtual-keyboard-redux'
import {boxShadow3dCss} from '../Keyboard/Keyboard'
import {Knob} from '../Volume/Knob'
import {ClientId} from '../websocket-listeners'
import {BasicInstrument} from './BasicInstrument'
import './BasicInstrumentView.less'
import SawWave from './SawWave.svg'
import SineWave from './SineWave.svg'
import SquareWave from './SquareWave.svg'

export type MidiNotes = IMidiNote[]

interface IBasicInstrumentViewProps {
	audio?: any
	color?: string
	brightColor?: string
	rawMidiNotes?: MidiNotes
	ownerId: ClientId
	pan?: number
	isPlaying?: boolean
	oscillatorType?: OscillatorType
}

export class BasicInstrumentView extends Component<IBasicInstrumentViewProps> {
	public static defaultProps = {
		pan: 0,
		rawMidiNotes: [],
		color: 'gray',
		brightColor: 'lightgray',
		oscillatorType: 'square',
	}

	private instrument: BasicInstrument

	constructor(props) {
		super(props)
		this.instrument = new BasicInstrument({
			audioContext: props.audio.context,
			destination: props.audio.preFx,
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
					<ReactSVG path={SineWave} />
					<ReactSVG path={SquareWave} className="active" />
					<ReactSVG path={SawWave} />
				</div>
			</div >
		)
	}
}

export const ConnectedBasicInstrumentView = connect((state: IAppState, props: IBasicInstrumentViewProps) => {
	const rawMidiNotes = props.ownerId ? selectMidiOutput(state, props.ownerId).notes : []

	return {
		audio: state.audio,
		rawMidiNotes,
		isPlaying: rawMidiNotes.length > 0,
	}
})(BasicInstrumentView)
