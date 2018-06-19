import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {IMidiNote} from '../../common/MidiNote'
import {IAppState} from '../../common/redux/configureStore'
import {selectMidiOutput} from '../../common/redux/virtual-keyboard-redux'
import {boxShadow3dCss} from '../Keyboard/Keyboard'
import {Knob} from '../Volume/Knob'
import {ClientId} from '../websocket-listeners'
import {BasicInstrument} from './BasicInstrument'
import './BasicInstrumentView.less'

export type MidiNotes = IMidiNote[]

interface IBasicInstrumentViewProps {
	audio?: any
	color: string
	rawMidiNotes?: MidiNotes
	ownerId: ClientId
	pan?: number
}

export class BasicInstrumentView extends Component<IBasicInstrumentViewProps> {
	public static defaultProps = {
		pan: 0,
		rawMidiNotes: [],
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
		const {color, pan, rawMidiNotes} = this.props

		this.instrument.setMidiNotes(rawMidiNotes)

		return (
			<div className="basicInstrument" style={{boxShadow: boxShadow3dCss(4, color)}}>
				<div className="label">basic instrument</div>
				<Knob min={-1} max={1} value={pan} label="pan" />
			</div>
		)
	}
}

export const ConnectedBasicInstrumentView = connect((state: IAppState, props: IBasicInstrumentViewProps) => ({
	audio: state.audio,
	rawMidiNotes: props.ownerId ? selectMidiOutput(state, props.ownerId).notes : [],
}))(BasicInstrumentView)
