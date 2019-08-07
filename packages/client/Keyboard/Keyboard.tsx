import React, {useState, useCallback, useEffect} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {applyOctave, getKeyByValue} from '@corgifm/common/common-utils'
import {
	selectClientById, selectLocalClient, IClientAppState,
	selectVirtualKeyboardById, virtualKeyPressed, virtualKeyUp,
	selectVirtualKeyboardOctave,
} from '@corgifm/common/redux'
import {
	keyColors, KeyColor, NoteNameSharps,
} from '@corgifm/common/common-samples-stuff'
import {isLeftMouseButtonDown} from '../client-utils'
import {keyToMidiMap} from '../input-events'
import {Panel} from '../Panel/Panel'
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

type IKeyboardAllProps = IKeyboardProps

interface IKeyboardProps {
	id: Id
}

const maxUsernameDisplayLength = 24

export const Keyboard = ({id}: IKeyboardAllProps) => {

	const [wasMouseClickedOnKeyboard, setWasMouseClickedOnKeyboard] =
		useState(false)

	const {
		ownerName, pressedMidiKeys, octave, color, isPlaying,
		virtualMidiKeyboard, isLocal, showNoteNames,
	} = useSelector(mapStateToProps(id))

	const dispatch = useDispatch()

	const handleMouseOver = useCallback((e: React.MouseEvent, index: number) => {
		if (isLocal === false) return
		if (isLeftMouseButtonDown(e.buttons) && wasMouseClickedOnKeyboard) {
			dispatch(
				virtualKeyPressed(id, index, octave, applyOctave(index, octave)),
			)
		}
	}, [dispatch, id, isLocal, octave, wasMouseClickedOnKeyboard])

	const handleMouseOut = useCallback((e: React.MouseEvent, index: number) => {
		if (isLocal === false) return
		if (isLeftMouseButtonDown(e.buttons) && wasMouseClickedOnKeyboard) {
			dispatch(virtualKeyUp(id, index))
		}
	}, [dispatch, id, isLocal, wasMouseClickedOnKeyboard])

	const handleMouseDown = useCallback(
		(e: React.MouseEvent, index: number, isKeyPressed: boolean) => {
			if (isLocal === false) return
			if (e.button === 0) {
				setWasMouseClickedOnKeyboard(true)
				if (e.shiftKey) {
					if (isKeyPressed) {
						dispatch(virtualKeyUp(id, index))
					} else {
						dispatch(
							virtualKeyPressed(id, index, octave, applyOctave(index, octave)),
						)
					}
				} else {
					dispatch(
						virtualKeyPressed(id, index, octave, applyOctave(index, octave)),
					)
				}
			}
		},
		[dispatch, id, isLocal, octave])

	const handleMouseUp = useCallback((e: React.MouseEvent, index: number) => {
		if (isLocal === false) return
		if (e.button === 0 && e.shiftKey === false) {
			dispatch(virtualKeyUp(id, index))
		}
	}, [dispatch, id, isLocal])

	const handleWindowMouseUp = useCallback((e: MouseEvent) => {
		if (e.button === 0) {
			setWasMouseClickedOnKeyboard(false)
		}
	}, [])

	useEffect(() => {
		if (isLocal) {
			window.removeEventListener('mouseup', handleWindowMouseUp)
			window.addEventListener('mouseup', handleWindowMouseUp)
		}

		return () => {
			window.removeEventListener('mouseup', handleWindowMouseUp)
		}
	}, [isLocal, handleWindowMouseUp])

	const isOwnerNameTooLong = ownerName.length > maxUsernameDisplayLength

	const ownerNameDisplay = isOwnerNameTooLong
		? ownerName.substring(0, maxUsernameDisplayLength) + '...'
		: ownerName

	return (
		<Panel
			color={color}
			className={`keyboard ${isLocal ? 'isLocal' : 'notLocal'} ${isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
			label="Virtual Keyboard"
			labelTitle={isOwnerNameTooLong ? ownerName.toUpperCase() : ''}
			id={id}
			saturate={isPlaying}
			ownerName={ownerNameDisplay}
		>
			<OctaveSection id={id} />
			{virtualMidiKeyboard.map((value, index) => {
				const isKeyPressed = pressedMidiKeys
					.map(x => x >= virtualMidiKeyboard.length || x < 0 ? (x + 1200) % 12 : x)
					.some(x => x === index)

				return (
					// eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
					<div
						// eslint-disable-next-line react/no-array-index-key
						key={index}
						className={`key ${value.color} ${isKeyPressed ? 'pressed' : 'notPressed'}`}
						onMouseOver={e => handleMouseOver(e, index)}
						onMouseOut={e => handleMouseOut(e, index)}
						onMouseDown={e => handleMouseDown(e, index, isKeyPressed)}
						onMouseUp={e => handleMouseUp(e, index)}
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

const OctaveSection = React.memo(({id}: {id: Id}) => {
	const octave = useSelector(selectVirtualKeyboardOctave(id))

	return (
		<div className="octave black unselectable">
			<div className="octaveNumber">
				<div>{octave}</div>
			</div>
			<div className="octaveKeys smallText">
				<span>z</span>
				<span>x</span>
			</div>
		</div>
	)
})

function mapStateToProps(id: Id) {
	return (state: IClientAppState) => {
		const virtualKeyboard = selectVirtualKeyboardById(state.room, id)
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
}
