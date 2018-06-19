import classnames from 'classnames'
import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {DummyClient} from '../../common/redux/clients-redux'
import {IAppState} from '../../common/redux/configureStore'
import {
	virtualKeyFlip, virtualKeyPressed, virtualKeyUp,
} from '../../common/redux/virtual-keyboard-redux'
import {keyToMidiMap} from '../input-events'
import {Octave} from '../music/music-types'
import {hashbow, keyColors} from '../utils'
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
	keyPressed: (index: number) => void
	keyUp: (index: number) => void
	keyFlip: (index: number) => void
	isLocal: boolean
	showNoteNames: boolean
}

export class Keyboard extends React.Component<IKeyboardProps> {
	public static defaultProps = {
		pressedMidiKeys: [],
		owner: new DummyClient(),
		showNoteNames: true,
	}

	constructor(props) {
		super(props)
	}

	public render() {
		const {pressedMidiKeys, octave, color,
			virtualMidiKeyboard, isLocal, showNoteNames} = this.props

		return (
			<div
				className={classnames([
					'keyboard',
					isLocal ? 'isLocal' : '',
				])}
				style={{boxShadow: boxShadow3dCss(4, color)}}
			>
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
							className={'key ' + value.color}
							style={{backgroundColor: isKeyPressed ? color : ''}}
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
		)
	}

	private handleMouseOver = (e: React.MouseEvent, index: number) => {
		if (this.props.isLocal === false) return
		if (isLeftMouseButtonDown(e.buttons)) {
			this.props.keyPressed(index)
		}
	}

	private handleMouseOut = (e: React.MouseEvent, index: number) => {
		if (this.props.isLocal === false) return
		if (isLeftMouseButtonDown(e.buttons)) {
			this.props.keyUp(index)
		}
	}

	private handleMouseDown = (e: React.MouseEvent, index: number) => {
		if (this.props.isLocal === false) return
		if (e.button === 0) {
			if (e.shiftKey) {
				this.props.keyFlip(index)
			} else {
				this.props.keyPressed(index)
			}
		}
	}

	private handleMouseUp = (e: React.MouseEvent, index: number) => {
		if (this.props.isLocal === false) return
		if (e.button === 0 && e.shiftKey === false) {
			this.props.keyUp(index)
		}
	}
}

/** @param buttons The buttons property from a mouse event */
function isLeftMouseButtonDown(buttons: number): boolean {
	// buttons is not implemented in safari :(
	if (buttons === undefined) return false

	return buttons % 2 === 1
}

export function boxShadow3dCss(size: number, color: string) {
	let x = ''

	for (let i = 0; i < size; i++) {
		x += `${-i - 1}px ${i + 2}px ${color},`
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

const mapStateToProps = (state: IAppState, props) => {
	const owner = state.clients.find(x => x.id === props.ownerId)
	const virtualKeyboard = state.virtualKeyboards[props.ownerId]

	return {
		pressedMidiKeys: virtualKeyboard && virtualKeyboard.pressedKeys,
		octave: virtualKeyboard && virtualKeyboard.octave,
		virtualMidiKeyboard: globalVirtualMidiKeyboard,
		color: props.color || (owner && owner.color) || hashbow(props.ownerId),
		isLocal: state.websocket.myClientId === props.ownerId,
		showNoteNames: state.options.showNoteNamesOnKeyboard,
	}
}

const mapDispatchToProps = (dispatch: Dispatch, props: IKeyboardProps) => {
	return {
		keyPressed: index => dispatch(virtualKeyPressed(props.ownerId, index)),
		keyUp: index => dispatch(virtualKeyUp(props.ownerId, index)),
		keyFlip: index => dispatch(virtualKeyFlip(props.ownerId, index)),
	}
}

export const ConnectedKeyboard = connect(mapStateToProps, mapDispatchToProps)(Keyboard)
