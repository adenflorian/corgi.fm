import * as React from 'react'
import {connect} from 'react-redux'
import {BasicInstrument} from './BasicInstrument'
import './Keyboard.css'
import {IMidiNote} from './MidiNote'
import {Octave} from './music-types'
import {DummyClient, IClient} from './redux/clients-redux'
import {IAppState} from './redux/configureStore'
import {selectMidiOutput} from './redux/virtual-keyboard-redux'
import {keyToMidiMap} from './redux/virtual-midi-keyboard-middleware'
import {ClientId} from './websocket'

const keyColors = Object.freeze({
	0: {color: 'white', name: 'C'},
	1: {color: 'black', name: 'C#'},
	2: {color: 'white', name: 'D'},
	3: {color: 'black', name: 'D#'},
	4: {color: 'white', name: 'E'},
	5: {color: 'white', name: 'F'},
	6: {color: 'black', name: 'F#'},
	7: {color: 'white', name: 'G'},
	8: {color: 'black', name: 'G#'},
	9: {color: 'white', name: 'A'},
	10: {color: 'black', name: 'A#'},
	11: {color: 'white', name: 'B'},
})

const defaultNumberOfKeys = 17

const globalVirtualMidiKeyboard = createVirtualMidiKeyboard(defaultNumberOfKeys)

function createVirtualMidiKeyboard(numberOfKeys: number) {
	const newVirtualMidiKeyboard = []

	for (let i = 0; i < numberOfKeys; i++) {
		const baseNumber = i % 12
		newVirtualMidiKeyboard[i] = {
			...keyColors[baseNumber],
			keyName: Object.keys(keyToMidiMap)[i],
		}
	}

	return newVirtualMidiKeyboard
}

interface IKeyboardProps {
	ownerId: ClientId,
	pressedMidiKeys?: any,
	octave?: Octave
	owner: IClient
	actualMidiNotes: IMidiNote[]
	audio: any
	virtualMidiKeyboard: any
}

function boxShadow3dCss(size: number, color: string) {
	let x = ''

	for (let i = 0; i < size; i++) {
		x += `${-i + 0}px ${i + 2}px ${color},`
	}

	return x.replace(/,$/, '')

	/*
	0px 1px #999,
	-1px 2px #999,
	-2px 3px #999,
	-3px 4px #999,
	-4px 5px #999,
	-5px 6px #999;
	*/
}

export class Keyboard extends React.Component<IKeyboardProps> {
	public static defaultProps = {
		pressedMidiKeys: [],
		owner: new DummyClient(),
	}

	private instrument: BasicInstrument

	constructor(props) {
		super(props)
		this.instrument = new BasicInstrument({
			audioContext: props.audio.context,
			destination: props.audio.master,
		})
		if (props.myKeyboard) {
			this.instrument.setPan(-0.5)
		} else {
			this.instrument.setPan(0.5)
		}
	}

	public render() {
		const {actualMidiNotes, pressedMidiKeys, octave, owner, virtualMidiKeyboard} = this.props

		this.instrument.setMidiNotes(actualMidiNotes)

		return (
			<div className="keyboard" style={{boxShadow: boxShadow3dCss(8, owner.color)}}>
				<div className="octave">
					{octave}
				</div>
				{virtualMidiKeyboard.map((value, index) => {
					const isKeyPressed = pressedMidiKeys.some(x => x === index)

					return (
						<div
							key={index}
							className={'key ' + value.color}
							style={{backgroundColor: isKeyPressed ? owner.color : ''}}
						>
							<div className="noteName">
								{value.name}
							</div>
							<div className="keyName">
								{value.keyName}
							</div>

						</div>
					)
				})}
			</div>
		)
	}
}

const mapStateToProps = (state: IAppState, props) => {
	const owner = state.clients.find(x => x.id === props.ownerId)
	const virtualKeyboard = state.virtualKeyboards[props.ownerId]

	return {
		pressedMidiKeys: virtualKeyboard && virtualKeyboard.pressedKeys,
		owner,
		octave: virtualKeyboard && virtualKeyboard.octave,
		audio: state.audio,
		actualMidiNotes: owner ? selectMidiOutput(state, owner.id).notes : [],
		virtualMidiKeyboard: globalVirtualMidiKeyboard,
	}
}

export const ConnectedKeyboard = connect(mapStateToProps)(Keyboard)
