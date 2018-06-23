import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IBasicInstrumentState, selectInstrumentByOwner} from '../../common/redux/basic-instruments-redux'
import {DummyClient} from '../../common/redux/clients-redux'
import {IAppState} from '../../common/redux/configureStore'
import {addConnection, Connection} from '../../common/redux/connections-redux'
import {
	selectVirtualKeyboardByOwner, virtualKeyFlip, virtualKeyPressed, virtualKeyUp,
} from '../../common/redux/virtual-keyboard-redux'
import {keyToMidiMap} from '../input-events'
import {Octave} from '../music/music-types'
import {keyColors} from '../utils'
import {ClientId} from '../websocket-listeners'
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
	ownerId: ClientId,
	pressedMidiKeys?: any,
	octave?: Octave
	virtualMidiKeyboard: any
	color: string
	isLocal: boolean
	showNoteNames: boolean
	isPlaying?: boolean
	dispatch?: Dispatch
	id?: string
	instrumentId?: string
}

export class Keyboard extends React.Component<IKeyboardProps> {
	public static defaultProps = {
		pressedMidiKeys: [],
		owner: new DummyClient(),
		showNoteNames: true,
	}

	constructor(props: IKeyboardProps) {
		super(props)
		if (props.isLocal) {
			props.dispatch(addConnection(new Connection(props.id, props.instrumentId)))
		}
	}

	public render() {
		const {ownerId, pressedMidiKeys, octave, color, isPlaying,
			virtualMidiKeyboard, isLocal, showNoteNames} = this.props

		return (
			<div
				style={{color}}
				className={`keyboard ${isLocal ? 'isLocal' : ''} ${isPlaying ? 'saturate' : 'isNotPlaying'}`}
			>
				<div className="label clientId colorize">
					{ownerId || '""'}
				</div>
				<div className="container">
					<div className="isometricBoxShadow"></div>
					<div className="octave black unselectable">
						<div className="octaveNumber">
							{octave}
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
			this.props.dispatch(virtualKeyPressed(this.props.ownerId, index))
		}
	}

	private handleMouseOut = (e: React.MouseEvent, index: number) => {
		if (this.props.isLocal === false) return
		if (isLeftMouseButtonDown(e.buttons)) {
			this.props.dispatch(virtualKeyUp(this.props.ownerId, index))
		}
	}

	private handleMouseDown = (e: React.MouseEvent, index: number) => {
		if (this.props.isLocal === false) return
		if (e.button === 0) {
			if (e.shiftKey) {
				this.props.dispatch(virtualKeyFlip(this.props.ownerId, index))
			} else {
				this.props.dispatch(virtualKeyPressed(this.props.ownerId, index))
			}
		}
	}

	private handleMouseUp = (e: React.MouseEvent, index: number) => {
		if (this.props.isLocal === false) return
		if (e.button === 0 && e.shiftKey === false) {
			this.props.dispatch(virtualKeyUp(this.props.ownerId, index))
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
	const owner = state.clients.find(x => x.id === props.ownerId)
	const virtualKeyboard = selectVirtualKeyboardByOwner(state, props)
	const pressedMidiKeys = virtualKeyboard ? virtualKeyboard.pressedKeys : []
	const instrument = selectInstrumentByOwner(state, props.ownerId) || {} as IBasicInstrumentState

	return {
		pressedMidiKeys,
		octave: virtualKeyboard && virtualKeyboard.octave,
		virtualMidiKeyboard: globalVirtualMidiKeyboard,
		color: props.color || (owner && owner.color),
		isLocal: state.websocket.myClientId === props.ownerId,
		showNoteNames: state.options.showNoteNamesOnKeyboard,
		isPlaying: pressedMidiKeys.length > 0,
		id: virtualKeyboard.id,
		instrumentId: instrument.id,
	}
}

export const ConnectedKeyboard = connect(mapStateToProps)(Keyboard)
