import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IAppState} from '../../common/redux/client-store'
import {ClientState, selectClientById, selectLocalClient} from '../../common/redux/clients-redux'
import {selectVirtualKeyboardById, virtualKeyPressed, virtualKeyUp} from '../../common/redux/virtual-keyboard-redux'
import {keyToMidiMap} from '../input-events'
import {Octave} from '../music/music-types'
import {isLeftMouseButtonDown, keyColors} from '../utils'
import './Keyboard.less'

const defaultNumberOfKeys = 17

const globalVirtualMidiKeyboard = createVirtualMidiKeyboard(defaultNumberOfKeys)

function createVirtualMidiKeyboard(numberOfKeys: number) {
	const newVirtualMidiKeyboard: IVirtualMidiKeyboard = []

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

type IVirtualMidiKeyboard = IVirtualMidiKey[]

interface IVirtualMidiKey {
	color: string
	keyName: string
	name: string
}

type IKeyboardAllProps = IKeyboardProps & IKeyboardReduxProps & {dispatch: Dispatch}

interface IKeyboardProps {
	id: string
}

interface IKeyboardReduxProps {
	color: string
	isLocal: boolean
	isPlaying: boolean
	octave: Octave
	ownerName: string,
	pressedMidiKeys: any[],
	showNoteNames: boolean
	virtualMidiKeyboard: IVirtualMidiKeyboard
}

interface IKeyboardState {
	wasMouseClickedOnKeyboard: boolean
}

export class Keyboard extends React.PureComponent<IKeyboardAllProps, IKeyboardState> {
	public state = {
		wasMouseClickedOnKeyboard: false,
	}

	constructor(props: IKeyboardAllProps) {
		super(props)
	}

	public componentDidMount() {
		if (this.props.isLocal) {
			window.addEventListener('mouseup', this.handleWindowMouseUp)
		}
	}

	public componentWillUnmount() {
		if (this.props.isLocal) {
			window.removeEventListener('mouseup', this.handleWindowMouseUp)
		}
	}

	public render() {
		const {ownerName, pressedMidiKeys, octave, color, isPlaying,
			virtualMidiKeyboard, isLocal, showNoteNames} = this.props

		const maxUsernameDisplayLength = 24

		const isOwnerNameTooLong = ownerName.length > maxUsernameDisplayLength

		const ownerNameDisplay = isOwnerNameTooLong ? ownerName.substring(0, maxUsernameDisplayLength) + '...' : ownerName

		return (
			<div
				style={{color}}
				className={`keyboard ${isLocal ? 'isLocal' : ''} ${isPlaying ? 'saturate' : 'isNotPlaying'}`}
			>
				<div className="label clientId colorize" title={isOwnerNameTooLong ? ownerName.toUpperCase() : ''}>
					{ownerNameDisplay || '""'}
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
								onMouseDown={e => this.handleMouseDown(e, index, isKeyPressed)}
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
		if (isLeftMouseButtonDown(e.buttons) && this.state.wasMouseClickedOnKeyboard) {
			this.props.dispatch(virtualKeyPressed(this.props.id, index))
		}
	}

	private handleMouseOut = (e: React.MouseEvent, index: number) => {
		if (this.props.isLocal === false) return
		if (isLeftMouseButtonDown(e.buttons) && this.state.wasMouseClickedOnKeyboard) {
			this.props.dispatch(virtualKeyUp(this.props.id, index))
		}
	}

	private handleMouseDown = (e: React.MouseEvent, index: number, isKeyPressed: boolean) => {
		if (this.props.isLocal === false) return
		if (e.button === 0) {
			this.setState({wasMouseClickedOnKeyboard: true})
			if (e.shiftKey) {
				if (isKeyPressed) {
					this.props.dispatch(virtualKeyUp(this.props.id, index))
				} else {
					this.props.dispatch(virtualKeyPressed(this.props.id, index))
				}
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

	private handleWindowMouseUp = (e: MouseEvent) => {
		if (e.button === 0) {
			this.setState({wasMouseClickedOnKeyboard: false})
		}
	}
}

const mapStateToProps = (state: IAppState, props: IKeyboardProps): IKeyboardReduxProps => {
	const virtualKeyboard = selectVirtualKeyboardById(state, props.id)
	const owner = selectClientById(state, virtualKeyboard.ownerId) || {} as ClientState
	const pressedMidiKeys = virtualKeyboard ? virtualKeyboard.pressedKeys : []
	const localClient = selectLocalClient(state)

	return {
		color: owner.color,
		isLocal: localClient.id === owner.id,
		isPlaying: pressedMidiKeys.length > 0,
		octave: virtualKeyboard.octave,
		ownerName: owner.name,
		pressedMidiKeys,
		showNoteNames: state.options.showNoteNamesOnKeyboard,
		virtualMidiKeyboard: globalVirtualMidiKeyboard,
	}
}

export const ConnectedKeyboard = connect(
	mapStateToProps,
)(Keyboard as React.ComponentClass<IKeyboardAllProps>) as React.ComponentClass<IKeyboardProps>
