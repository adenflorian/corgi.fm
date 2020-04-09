import React, {useState, useCallback, useEffect} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import * as Immutable from 'immutable'
import {stripIndents} from 'common-tags'
import {
	getKeyByValue, keyToMidiMap,
} from '@corgifm/common/common-utils'
import {
	IClientAppState, selectClientById,
	selectLocalClientId, expKeyboardsActions,
} from '@corgifm/common/redux'
import {
	keyColors,
} from '@corgifm/common/common-samples-stuff'
import {IVirtualMidiKeyboard, IVirtualMidiKey} from '@corgifm/common/common-types'
import {isLeftMouseButtonDown} from '../../../client-utils'
import './ExpKeyboard.less'
import {useNodeContext, useExpNodeOwnerId} from '../../CorgiNode'
import {KeyboardNode, useExpKeyboardOctave, useExpKeyboardPressedKeys} from './KeyboardNode'

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

const maxUsernameDisplayLength = 24

export const ExpKeyboard = React.memo(function _ExpKeyboard() {

	const [wasMouseClickedOnKeyboard, setWasMouseClickedOnKeyboard] =
		useState(false)

	const nodeContext = useNodeContext() as KeyboardNode

	const ownerId = useExpNodeOwnerId()

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
		// <Panel
		// 	color={color}
		// 	className={`expKeyboard ${isLocal ? 'isLocal' : 'notLocal'}`}
		// 	label="Virtual Keyboard"
		// 	labelTitle={isOwnerNameTooLong ? ownerName.toUpperCase() : ''}
		// 	id={id}
		// 	ownerName={ownerNameDisplay}
		// >
		<div className={`expKeyboard ${isLocal ? 'isLocal' : 'notLocal'}`}>
			<OctaveSection />
			{globalVirtualMidiKeyboard.map((value, index) => {
				return <Key
					key={index}
					index={index}
					virtualMidiKey={value}
					isLocal={isLocal}
					wasMouseClickedOnKeyboard={wasMouseClickedOnKeyboard}
					setWasMouseClickedOnKeyboard={setWasMouseClickedOnKeyboard}
				/>
			})}
		</div>
	)
})

interface KeyProps {
	index: number
	virtualMidiKey: IVirtualMidiKey
	isLocal: boolean
	wasMouseClickedOnKeyboard: boolean
	setWasMouseClickedOnKeyboard: (value: boolean) => void
}

const Key = React.memo(function _Key({
	index, virtualMidiKey, isLocal, wasMouseClickedOnKeyboard,
	setWasMouseClickedOnKeyboard,
}: KeyProps) {

	const nodeContext = useNodeContext() as KeyboardNode

	const keyboardState = useExpKeyboardPressedKeys()

	const isKeyPressed = keyboardState
		.pressedKeys
		.map(x => x >= globalVirtualMidiKeyboard.length || x < 0 ? (x + 1200) % 12 : x)
		.some(x => x === index)

	const showNoteNames = useSelector((state: IClientAppState) => state.options.showNoteNamesOnKeyboard)

	const dispatch = useDispatch()

	const handleMouseOver = useCallback((e: React.MouseEvent) => {
		if (isLeftMouseButtonDown(e.buttons) && wasMouseClickedOnKeyboard) {
			nodeContext.onNoteOn(index, 1, true)
			// TODO Velocity
			dispatch(expKeyboardsActions.keysDown(keyboardState.id, Immutable.Set([index])))
		}
	}, [dispatch, index, wasMouseClickedOnKeyboard, keyboardState.id])

	const handleMouseOut = useCallback((e: React.MouseEvent) => {
		if (isLeftMouseButtonDown(e.buttons) && wasMouseClickedOnKeyboard) {
			nodeContext.onNoteOff(index, true)
			dispatch(expKeyboardsActions.keysUp(keyboardState.id, Immutable.Set([index])))
		}
	}, [dispatch, index, wasMouseClickedOnKeyboard, keyboardState.id])

	const handleMouseDown = useCallback((
		e: React.MouseEvent,
	) => {
		if (e.button === 0) {
			setWasMouseClickedOnKeyboard(true)
			if (e.shiftKey) {
				if (isKeyPressed) {
					nodeContext.onNoteOff(index, true)
					dispatch(expKeyboardsActions.keysUp(keyboardState.id, Immutable.Set([index])))
				} else {
					nodeContext.onNoteOn(index, 1, true)
					// TODO Velocity
					dispatch(expKeyboardsActions.keysDown(keyboardState.id, Immutable.Set([index])))
				}
			} else {
				nodeContext.onNoteOn(index, 1, true)
				// TODO Velocity
				dispatch(expKeyboardsActions.keysDown(keyboardState.id, Immutable.Set([index])))
			}
		}
	}, [dispatch, index, isKeyPressed, setWasMouseClickedOnKeyboard, keyboardState.id])

	const handleMouseUp = useCallback((e: React.MouseEvent) => {
		if (e.button === 0 && e.shiftKey === false) {
			nodeContext.onNoteOff(index, true)
			dispatch(expKeyboardsActions.keysUp(keyboardState.id, Immutable.Set([index])))
		}
	}, [dispatch, index, keyboardState.id])

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

const OctaveSection = React.memo(function _OctaveSection() {
	const octave = useExpKeyboardOctave()

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
