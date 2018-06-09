import * as React from 'react'
import {connect} from 'react-redux'
import './Keyboard.css'
import {IAppState} from './redux/configureStore'
import {ClientId} from './websocket'

const pianoKeys = Object.freeze({
	'C': {color: 'white', keyboardKey: 'a'},
	'C#': {color: 'black', keyboardKey: 'w'},
	'D': {color: 'white', keyboardKey: 's'},
	'D#': {color: 'black', keyboardKey: 'e'},
	'E': {color: 'white', keyboardKey: 'd'},
	'F': {color: 'white', keyboardKey: 'f'},
	'F#': {color: 'black', keyboardKey: 't'},
	'G': {color: 'white', keyboardKey: 'g'},
	'G#': {color: 'black', keyboardKey: 'y'},
	'A': {color: 'white', keyboardKey: 'h'},
	'A#': {color: 'black', keyboardKey: 'u'},
	'B': {color: 'white', keyboardKey: 'j'},
})

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

// const keyColors = new Map<number, any>([
// 	[0, {color: 'white', name: 'C'}],
// 	[1, {color: 'black', name: 'C#'}],
// 	[2, {color: 'white', name: 'D'}],
// 	[3, {color: 'black', name: 'D#'}],
// 	[4, {color: 'white', name: 'E'}],
// 	[5, {color: 'white', name: 'F'}],
// 	[6, {color: 'black', name: 'F#'}],
// 	[7, {color: 'white', name: 'G'}],
// 	[8, {color: 'black', name: 'G#'}],
// 	[9, {color: 'white', name: 'A'}],
// 	[10, {color: 'black', name: 'A#'}],
// 	[11, {color: 'white', name: 'B'}],
// ])

const defaultNumberOfKeys = 13

const virtualMidiKeyboard = createVirtualMidiKeyboard(defaultNumberOfKeys)

function createVirtualMidiKeyboard(numberOfKeys: number) {
	const newVirtualMidiKeyboard = []

	for (let i = 0; i < numberOfKeys; i++) {
		const baseNumber = i % 12
		newVirtualMidiKeyboard[i] = keyColors[baseNumber]
	}

	return newVirtualMidiKeyboard
}

interface IKeyboardProps {
	ownerId: ClientId,
	pressedMidiKeys: any
}

export class Keyboard extends React.PureComponent<IKeyboardProps> {
	public static defaultProps = {
		pressedMidiKeys: [],
	}

	public render() {
		const {pressedMidiKeys} = this.props
		return (
			<div id="keyboard">
				{virtualMidiKeyboard.map((value, index) => {
					const isKeyPressed = pressedMidiKeys.some(x => (x % 12) === index)

					const keyPressedClass = isKeyPressed ? 'pressed' : ''

					return (
						<span
							key={index}
							className={value.color + ' ' + keyPressedClass}
						>
							{value.name}
						</span>
					)
				})}
			</div>
		)
	}
}

const mapStateToProps = (state: IAppState, props) => ({
	pressedMidiKeys: state.virtualKeyboards[props.ownerId] && state.virtualKeyboards[props.ownerId].pressedKeys,
})

export const ConnectedKeyboard = connect(mapStateToProps)(Keyboard)
