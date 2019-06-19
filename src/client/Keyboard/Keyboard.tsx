import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {getKeyByValue} from '../../common/common-utils'
import {IMidiNotes} from '../../common/MidiNote'
import {selectClientById, selectLocalClient} from '../../common/redux'
import {IClientAppState} from '../../common/redux'
import {selectVirtualKeyboardById, virtualKeyPressed, virtualKeyUp} from '../../common/redux'
import {isLeftMouseButtonDown} from '../client-utils'
import {keyToMidiMap} from '../input-events'
import {Panel} from '../Panel/Panel'
import {applyOctave, KeyColor, keyColors, NoteNameSharps} from '../WebAudio/music-functions'
import {Octave} from '../WebAudio/music-types'
import './Keyboard.less'

const defaultNumberOfKeys = 17

const globalVirtualMidiKeyboard = createVirtualMidiKeyboard(defaultNumberOfKeys)

function createVirtualMidiKeyboard(numberOfKeys: number) {
	const newVirtualMidiKeyboard: IVirtualMidiKeyboard = []

	for (let i = 0; i < numberOfKeys; i++) {
		const baseNumber = i % 12
		newVirtualMidiKeyboard[i] = {
			...keyColors[baseNumber],
			keyName: getKeyByValue(keyToMidiMap.toJS(), i)!,
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
	color: KeyColor
	keyName: string
	name: NoteNameSharps
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
	pressedMidiKeys: IMidiNotes,
	showNoteNames: boolean
	virtualMidiKeyboard: IVirtualMidiKeyboard
}

interface IKeyboardState {
	wasMouseClickedOnKeyboard: boolean
}

const maxUsernameDisplayLength = 24

export class Keyboard extends React.PureComponent<IKeyboardAllProps, IKeyboardState> {
	public state = {
		wasMouseClickedOnKeyboard: false,
	}

	constructor(props: IKeyboardAllProps) {
		super(props)
	}

	public componentDidMount() {
		if (this.props.isLocal) {
			window.removeEventListener('mouseup', this.handleWindowMouseUp)
			window.addEventListener('mouseup', this.handleWindowMouseUp)
		}
	}

	public componentWillUnmount() {
		window.removeEventListener('mouseup', this.handleWindowMouseUp)
	}

	public render() {
		const {ownerName, pressedMidiKeys, octave, color, isPlaying,
			virtualMidiKeyboard, isLocal, showNoteNames} = this.props

		const isOwnerNameTooLong = ownerName.length > maxUsernameDisplayLength

		const ownerNameDisplay = isOwnerNameTooLong ? ownerName.substring(0, maxUsernameDisplayLength) + '...' : ownerName

		return (
			<Panel
				color={color}
				className={`keyboard ${isLocal ? 'isLocal' : ''}  ${isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
				label="Virtual Keyboard"
				labelTitle={isOwnerNameTooLong ? ownerName.toUpperCase() : ''}
				id={this.props.id}
				saturate={isPlaying}
				ownerName={ownerNameDisplay}
			>
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
					const isKeyPressed = pressedMidiKeys
						.map(x => x >= virtualMidiKeyboard.length || x < 0 ? (x + 1200) % 12 : x)
						.some(x => x === index)

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
			</Panel>
		)
	}

	private readonly handleMouseOver = (e: React.MouseEvent, index: number) => {
		if (this.props.isLocal === false) return
		if (isLeftMouseButtonDown(e.buttons) && this.state.wasMouseClickedOnKeyboard) {
			this.props.dispatch(
				virtualKeyPressed(this.props.id, index, this.props.octave, applyOctave(index, this.props.octave)),
			)
		}
	}

	private readonly handleMouseOut = (e: React.MouseEvent, index: number) => {
		if (this.props.isLocal === false) return
		if (isLeftMouseButtonDown(e.buttons) && this.state.wasMouseClickedOnKeyboard) {
			this.props.dispatch(virtualKeyUp(this.props.id, index))
		}
	}

	private readonly handleMouseDown = (e: React.MouseEvent, index: number, isKeyPressed: boolean) => {
		if (this.props.isLocal === false) return
		if (e.button === 0) {
			this.setState({wasMouseClickedOnKeyboard: true})
			if (e.shiftKey) {
				if (isKeyPressed) {
					this.props.dispatch(virtualKeyUp(this.props.id, index))
				} else {
					this.props.dispatch(
						virtualKeyPressed(this.props.id, index, this.props.octave, applyOctave(index, this.props.octave)),
					)
				}
			} else {
				this.props.dispatch(
					virtualKeyPressed(this.props.id, index, this.props.octave, applyOctave(index, this.props.octave)),
				)
			}
		}
	}

	private readonly handleMouseUp = (e: React.MouseEvent, index: number) => {
		if (this.props.isLocal === false) return
		if (e.button === 0 && e.shiftKey === false) {
			this.props.dispatch(virtualKeyUp(this.props.id, index))
		}
	}

	private readonly handleWindowMouseUp = (e: MouseEvent) => {
		if (e.button === 0) {
			this.setState({wasMouseClickedOnKeyboard: false})
		}
	}
}

const mapStateToProps = (state: IClientAppState, props: IKeyboardProps): IKeyboardReduxProps => {
	const virtualKeyboard = selectVirtualKeyboardById(state.room, props.id)
	const owner = selectClientById(state, virtualKeyboard.ownerId)
	const pressedMidiKeys = virtualKeyboard.pressedKeys
	const localClient = selectLocalClient(state)

	return {
		color: owner.color,
		isLocal: localClient.id === owner.id,
		isPlaying: pressedMidiKeys.count() > 0,
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
