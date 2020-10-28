import React, {useState, useCallback, useEffect} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {stripIndents} from 'common-tags'
import {
	getKeyByValue, keyToMidiMap,
} from '@corgifm/common/common-utils'
import {
	selectVirtualKeyboardOctave, IClientAppState,
	selectVirtualKeyboardById, selectClientById,
	selectLocalClientId, selectPosition, localMidiKeyPress, localMidiKeyUp,
} from '@corgifm/common/redux'
import {
	keyColors,
} from '@corgifm/common/common-samples-stuff'
import {IVirtualMidiKeyboard, IVirtualMidiKey} from '@corgifm/common/common-types'
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

export const Keyboard = React.memo(function _Keyboard({id}: IKeyboardAllProps) {

	const [wasMouseClickedOnKeyboard, setWasMouseClickedOnKeyboard] =
		useState(false)

	const ownerId = useSelector((state: IClientAppState) => selectPosition(state.room, id).ownerId)

	const ownerName = useSelector((state: IClientAppState) => selectClientById(state, ownerId).name)
	const color = useSelector((state: IClientAppState) => selectClientById(state, ownerId).color)

	const localClientId = useSelector((state: IClientAppState) => selectLocalClientId(state))

	const isLocal = localClientId === ownerId

	useEffect(() => {
		const handleWindowMouseUp = (e: MouseEvent) => {
			if (e.button === 0) {
				setWasMouseClickedOnKeyboard(false)
			}
		}

		if (isLocal) {
			window.addEventListener('mouseup', handleWindowMouseUp)
		}

		return () => {
			window.removeEventListener('mouseup', handleWindowMouseUp)
		}
	}, [isLocal])

	const isOwnerNameTooLong = ownerName.length > maxUsernameDisplayLength

	const ownerNameDisplay = isOwnerNameTooLong
		? ownerName.substring(0, maxUsernameDisplayLength) + '...'
		: ownerName

	return (
		<Panel
			color={color}
			className={`keyboard ${isLocal ? 'isLocal' : 'notLocal'}`}
			label="Virtual Keyboard"
			labelTitle={isOwnerNameTooLong ? ownerName.toUpperCase() : ''}
			id={id}
			ownerName={ownerNameDisplay}
		>
			<OctaveSection id={id} />
			{globalVirtualMidiKeyboard.map((value, index) => {
				return <Key
					key={index}
					id={id}
					index={index}
					virtualMidiKey={value}
					isLocal={isLocal}
					wasMouseClickedOnKeyboard={wasMouseClickedOnKeyboard}
					setWasMouseClickedOnKeyboard={setWasMouseClickedOnKeyboard}
				/>
			})}
		</Panel>
	)
})

interface KeyProps {
	id: Id
	index: number
	virtualMidiKey: IVirtualMidiKey
	isLocal: boolean
	wasMouseClickedOnKeyboard: boolean
	setWasMouseClickedOnKeyboard: (value: boolean) => void
}

const Key = React.memo(function _Key({
	id, index, virtualMidiKey, isLocal, wasMouseClickedOnKeyboard,
	setWasMouseClickedOnKeyboard,
}: KeyProps) {

	const isKeyPressed = useSelector((state: IClientAppState) => {
		return selectVirtualKeyboardById(state.room, id)
			.pressedKeys
			.map(x => x >= globalVirtualMidiKeyboard.length || x < 0 ? (x + 1200) % 12 : x)
			.some(x => x === index)
	})

	const showNoteNames = useSelector((state: IClientAppState) => state.options.showNoteNamesOnKeyboard)

	const dispatch = useDispatch()

	const handleMouseOver = useCallback((e: React.MouseEvent) => {
		if (isLeftMouseButtonDown(e.buttons) && wasMouseClickedOnKeyboard) {
			dispatch(localMidiKeyPress(index, 1, 'Keyboard component - handleMouseOver'))
		}
	}, [dispatch, index, wasMouseClickedOnKeyboard])

	const handleMouseOut = useCallback((e: React.MouseEvent) => {
		if (isLeftMouseButtonDown(e.buttons) && wasMouseClickedOnKeyboard) {
			dispatch(localMidiKeyUp(index, 'Keyboard component - handleMouseOut'))
		}
	}, [dispatch, index, wasMouseClickedOnKeyboard])

	const handleMouseDown = useCallback((
		e: React.MouseEvent,
	) => {
		if (e.button === 0) {
			setWasMouseClickedOnKeyboard(true)
			if (e.shiftKey) {
				if (isKeyPressed) {
					dispatch(localMidiKeyUp(index, 'Keyboard component - handleMouseDown'))
				} else {
					dispatch(localMidiKeyPress(index, 1, 'Keyboard component - handleMouseDown A'))
				}
			} else {
				dispatch(localMidiKeyPress(index, 1, 'Keyboard component - handleMouseDown B'))
			}
		}
	}, [dispatch, index, isKeyPressed, setWasMouseClickedOnKeyboard])

	const handleMouseUp = useCallback((e: React.MouseEvent) => {
		if (e.button === 0 && e.shiftKey === false) {
			dispatch(localMidiKeyUp(index, 'Keyboard component - handleMouseUp'))
		}
	}, [dispatch, index])

	return (
		// eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
		<div
			// eslint-disable-next-line react/no-array-index-key
			key={index}
			className={`key ${virtualMidiKey.color} ${isKeyPressed ? 'pressed' : 'notPressed'}`}
			onMouseOver={isLocal ? handleMouseOver : undefined}
			onMouseOut={isLocal ? handleMouseOut : undefined}
			onMouseDown={isLocal ? handleMouseDown : undefined}
			onMouseUp={isLocal ? handleMouseUp : undefined}
		>
			<div className="noteName unselectable">
				{showNoteNames &&
					virtualMidiKey.name
				}
			</div>
			{isLocal &&
				<div className="unselectable smallText">
					{virtualMidiKey.keyName}
				</div>
			}
		</div>
	)
})

const OctaveSection = React.memo(function _OctaveSection({id}: {id: Id}) {
	const octave = useSelector(selectVirtualKeyboardOctave(id))

	return (
		<div
			className="octave black unselectable"
			title={stripIndents`Octave

				Press Z or - to decrease octave
				Press X or + to increase octave`}
		>
			<div className="octaveKey smallText">z</div>
			<div className="octaveNumber">{octave}</div>
			<div className="octaveKey smallText">x</div>
		</div>
	)
})
