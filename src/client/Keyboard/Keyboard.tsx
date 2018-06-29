import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {ClientState, selectClientById, selectLocalClient} from '../../common/redux/clients-redux'
import {IAppState} from '../../common/redux/configureStore'
import {
	selectVirtualKeyboard, virtualKeyFlip, virtualKeyPressed, virtualKeyUp,
} from '../../common/redux/virtual-keyboard-redux'
import {keyToMidiMap} from '../input-events'
import {Octave} from '../music/music-types'
import {keyColors} from '../utils'
import './Keyboard.less'

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

export function isWhiteKey(keyNumber: number) {
	const baseNumber = keyNumber % 12

	return keyColors[baseNumber].color === 'white'
}

interface IKeyboardProps {
	ownerName: string,
	pressedMidiKeys?: any,
	octave?: Octave
	virtualMidiKeyboard: any
	color: string
	isLocal: boolean
	showNoteNames: boolean
	isPlaying?: boolean
	dispatch?: Dispatch
	id?: string
}

export class Keyboard extends React.Component<IKeyboardProps> {
	public static defaultProps = {
		pressedMidiKeys: [],
		showNoteNames: true,
	}

	constructor(props: IKeyboardProps) {
		super(props)
	}

	public render() {
		const {ownerName, pressedMidiKeys, octave, color, isPlaying,
			virtualMidiKeyboard, isLocal, showNoteNames} = this.props

		return (
			<div
				style={{color}}
				className={`keyboard ${isLocal ? 'isLocal' : ''} ${isPlaying ? 'saturate' : 'isNotPlaying'}`}
			>
				<div className="label clientId colorize">
					{ownerName || '""'}
				</div>
				<div id={this.props.id} className="container">
					<div className="isometricBoxShadow"></div>
					<div className="octave black unselectable">
						<div className="octaveNumber">
							<div>{octave}</div>
						</div>
						{isLocal &&
							<div className="octaveKeys smallText">
								<span>z</span><span>x</span>
							</div>
						}
					</div>
					{virtualMidiKeyboard.map((value, index) => {
						const isKeyPressed = pressedMidiKeys.some(x => x === index)
						return (
							<div
								key={index}
								className={`key ${value.color} ${isKeyPressed ? 'pressed' : 'notPressed'}`}
								onMouseOver={e => this.handleMouseOver(e, index)}
								onMouseOut={e => this.handleMouseOut(e, index)}
								onMouseDown={e => this.handleMouseDown(e, index)}
								onMouseUp={e => this.handleMouseUp(e, index)}
							>
								<div className="noteName unselectable">
									{showNoteNames &&
										value.name
									}
								</div>
								{isLocal &&
									<div className="unselectable smallText">
										{value.keyName}
									</div>
								}
							</div>
						)
					})}
				</div>
			</div>
		)
	}

	private handleMouseOver = (e: React.MouseEvent, index: number) => {
		if (this.props.isLocal === false) return
		if (isLeftMouseButtonDown(e.buttons)) {
			this.props.dispatch(virtualKeyPressed(this.props.id, index))
		}
	}

	private handleMouseOut = (e: React.MouseEvent, index: number) => {
		if (this.props.isLocal === false) return
		if (isLeftMouseButtonDown(e.buttons)) {
			this.props.dispatch(virtualKeyUp(this.props.id, index))
		}
	}

	private handleMouseDown = (e: React.MouseEvent, index: number) => {
		if (this.props.isLocal === false) return
		if (e.button === 0) {
			if (e.shiftKey) {
				this.props.dispatch(virtualKeyFlip(this.props.id, index))
			} else {
				this.props.dispatch(virtualKeyPressed(this.props.id, index))
			}
		}
	}

	private handleMouseUp = (e: React.MouseEvent, index: number) => {
		if (this.props.isLocal === false) return
		if (e.button === 0 && e.shiftKey === false) {
			this.props.dispatch(virtualKeyUp(this.props.id, index))
		}
	}
}

/** @param buttons The buttons property from a mouse event */
function isLeftMouseButtonDown(buttons: number): boolean {
	// buttons is not implemented in safari :(
	if (buttons === undefined) return false

	return buttons % 2 === 1
}

const mapStateToProps = (state: IAppState, props) => {
	const virtualKeyboard = selectVirtualKeyboard(state, props.id)
	const owner = selectClientById(state, virtualKeyboard.ownerId) || {} as ClientState
	const pressedMidiKeys = virtualKeyboard ? virtualKeyboard.pressedKeys : []
	const localClient = selectLocalClient(state)

	return {
		pressedMidiKeys,
		octave: virtualKeyboard && virtualKeyboard.octave,
		virtualMidiKeyboard: globalVirtualMidiKeyboard,
		color: owner && owner.color,
		isLocal: localClient.id === owner.id,
		showNoteNames: state.options.showNoteNamesOnKeyboard,
		isPlaying: pressedMidiKeys.length > 0,
		id: virtualKeyboard.id,
		ownerName: owner.name,
	}
}

export const ConnectedKeyboard = connect(mapStateToProps)(Keyboard)
