import * as React from 'react'
import {connect} from 'react-redux'
import './Keyboard.css'
import {IAppState} from './redux/configureStore'
import {IOtherClient} from './redux/other-clients-redux'

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
	// 'C5': {color: 'white', keyboardKey: 'k'},
	// 'C#5': {color: 'black', keyboardKey: 'o'},
	// 'D5': {color: 'white', keyboardKey: 'l'},
	// 'D#5': {color: 'black', keyboardKey: 'p'},
	// 'E5': {color: 'white', keyboardKey: ';'},
})

interface IKeyboardProps {
	pressedKeys: any,
	owner: string,
	otherClients: IOtherClient[]
}

export class Keyboard extends React.PureComponent<IKeyboardProps> {
	public render() {
		const {owner, otherClients, pressedKeys} = this.props
		return (
			<div id="keyboard">
				{Object.keys(pianoKeys).map(key => {
					const isMyKeyboard = owner === 'me'

					let isKeyPressed

					if (isMyKeyboard) {
						isKeyPressed = pressedKeys[pianoKeys[key].keyboardKey]
					} else {
						const otherClient = otherClients.filter(x => x.id === owner)[0]
						isKeyPressed = otherClient.note.note === key
					}

					const keyPressedClass = isKeyPressed ? 'pressed' : ''

					return (
						<span
							key={key}
							className={pianoKeys[key].color + ' ' + keyPressedClass}
						>
							{key}
						</span>
					)
				})}
			</div>
		)
	}
}

const mapStateToProps = (state: IAppState) => ({
	pressedKeys: state.keys,
	otherClients: state.otherClients,
})

export const ConnectedKeyboard = connect(mapStateToProps)(Keyboard)
