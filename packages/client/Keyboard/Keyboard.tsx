import React, {useState, useCallback, useEffect} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {stripIndents} from 'common-tags'
import {
	applyOctave, getKeyByValue, keyToMidiMap,
} from '@corgifm/common/common-utils'
import {
	virtualKeyPressed, virtualKeyUp, selectVirtualKeyboardOctave, IClientAppState,
	selectVirtualKeyboardById, selectClientById, selectLocalClientId,
} from '@corgifm/common/redux'
import {
	keyColors,
} from '@corgifm/common/common-samples-stuff'
import {IVirtualMidiKeyboard} from '@corgifm/common/common-types'
import {isLeftMouseButtonDown} from '../client-utils'
import {Panel} from '../Panel/Panel'
import './Keyboard.less'

export function isWhiteKey(keyNumber: number) {
	const baseNumber = keyNumber % 12

	return keyColors[baseNumber].color === 'white'
}

const defaultNumberOfKeys = 17

const globalVirtualMidiKeyboard = createVirtualMidiKeyboard(defaultNumberOfKeys)

function createVirtualMidiKeyboard(numberOfKeys: number) {
	const newVirtualMidiKeyboard: IVirtualMidiKeyboard = []

	for (let i = 0; i < numberOfKeys; i++) {
		const baseNumber = i % 12
		newVirtualMidiKeyboard[i] = {
			...keyColors[baseNumber],
			keyName: getKeyByValue(keyToMidiMap.toJS(), i)!,
		} as const
	}

	return Object.freeze(newVirtualMidiKeyboard)
}

type IKeyboardAllProps = IKeyboardProps

interface IKeyboardProps {
	id: Id
}

const maxUsernameDisplayLength = 24

export const Keyboard = ({id}: IKeyboardAllProps) => {

	const [wasMouseClickedOnKeyboard, setWasMouseClickedOnKeyboard] =
		useState(false)

	const ownerId = useSelector((state: IClientAppState) => selectVirtualKeyboardById(state.room, id).ownerId)
	const pressedMidiKeys = useSelector((state: IClientAppState) => selectVirtualKeyboardById(state.room, id).pressedKeys)
	const octave = useSelector((state: IClientAppState) => selectVirtualKeyboardById(state.room, id).octave)

	const ownerName = useSelector((state: IClientAppState) => selectClientById(state, ownerId).name)
	const color = useSelector((state: IClientAppState) => selectClientById(state, ownerId).color)

	const localClientId = useSelector((state: IClientAppState) => selectLocalClientId(state))

	const showNoteNames = useSelector((state: IClientAppState) => state.options.showNoteNamesOnKeyboard)

	const isLocal = localClientId === ownerId

	const isPlaying = pressedMidiKeys.count() > 0
	const virtualMidiKeyboard = globalVirtualMidiKeyboard

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
		<div
			className="octave black unselectable"
			title={stripIndents`Octave
				Press Z or - to decrease octave and X or + to increase octave`}
		>
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
