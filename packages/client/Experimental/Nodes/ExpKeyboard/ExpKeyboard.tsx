import React, {useState, useCallback, useEffect, useRef} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import * as Immutable from 'immutable'
import {stripIndents} from 'common-tags'
import {
	getKeyByValue, keyToMidiMap, clamp,
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

const noteWidth = 24
const noteHeight = 56

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

	const keyboardState = useExpKeyboardPressedKeys()

	const ownerId = useExpNodeOwnerId()

	const ownerName = useSelector((state: IClientAppState) => selectClientById(state, ownerId).name)
	const color = useSelector((state: IClientAppState) => selectClientById(state, ownerId).color)

	const localClientId = useSelector((state: IClientAppState) => selectLocalClientId(state))

	const isLocal = localClientId === ownerId

	useEffect(() => {
		const handleWindowMouseUp = (e: MouseEvent) => {
			if (e.button === 0) {
				setWasMouseClickedOnKeyboard(false)
				currentNote.current = null
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

	const dispatch = useDispatch()

	const currentNote = useRef<number | null>(null)

	const handleMouseDown = useCallback((
		e: React.MouseEvent,
	) => {
		if (e.button === 0) {
			const index = getNoteFromPosition(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
			setWasMouseClickedOnKeyboard(true)
			// TODO
			// if (e.shiftKey) {
			// 	if (isKeyPressed) {
			// 		nodeContext.onNoteOff(index, true)
			// 		dispatch(expKeyboardsActions.keysUp(keyboardState.id, Immutable.Set([index])))
			// 	} else {
			// 		nodeContext.onNoteOn(index, 1, true)
			// 		// TODO Velocity
			// 		dispatch(expKeyboardsActions.keysDown(keyboardState.id, Immutable.Set([index])))
			// 	}
			// } else {
				nodeContext.onNoteOn(index, 1, true)
				currentNote.current = index
				// TODO Velocity
				dispatch(expKeyboardsActions.keysDown(keyboardState.id, Immutable.Set([index])))
			// }
		}
	}, [dispatch, /* isKeyPressed,  */setWasMouseClickedOnKeyboard, keyboardState.id])

	const handleMouseUp = useCallback((e: React.MouseEvent) => {
		const index = getNoteFromPosition(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
		if (e.button === 0 && e.shiftKey === false) {
			nodeContext.onNoteOff(index, true)
			currentNote.current = null
			dispatch(expKeyboardsActions.keysUp(keyboardState.id, Immutable.Set([index])))
		}
	}, [dispatch, keyboardState.id])

	const keyboardZoneId = 'expKeyboardKeyzone-' + nodeContext.id

	useEffect(() => {
		if (!wasMouseClickedOnKeyboard) return

		const onMouseMove = (e: MouseEvent) => {
			if (e.target && (e.target as HTMLElement).id !== keyboardZoneId) {
				if (currentNote.current !== null) {
					handleMouseOut(currentNote.current, true)
				}
				return
			}
			if (!isLeftMouseButtonDown(e.buttons)) return
			const index = getNoteFromPosition(e.offsetX, e.offsetY)
			if (index !== currentNote.current) {
				if (currentNote.current !== null && index !== null) {
					nodeContext.onNoteOffAndOn(currentNote.current, index, 1, true)
					handleMouseOut(currentNote.current, false)
					handleMouseOver(index, false)
				} else {
					if (currentNote.current !== null) handleMouseOut(currentNote.current, true)
					if (index !== null) handleMouseOver(index, true)
				}
			}
		}

		const handleMouseOut = (index: number, trigger: boolean) => {
			currentNote.current = null
			if (trigger) nodeContext.onNoteOff(index, true)
			dispatch(expKeyboardsActions.keysUp(keyboardState.id, Immutable.Set([index])))
		}

		const handleMouseOver = (index: number, trigger: boolean) => {
			currentNote.current = index
			if (trigger) nodeContext.onNoteOn(index, 1, true)
			// TODO Velocity
			dispatch(expKeyboardsActions.keysDown(keyboardState.id, Immutable.Set([index])))
		}

		window.addEventListener('mousemove', onMouseMove)

		return () => {
			window.removeEventListener('mousemove', onMouseMove)
		}
	}, [wasMouseClickedOnKeyboard])

	const pressedKeys = keyboardState
		.pressedKeys
		.map(x => x >= globalVirtualMidiKeyboard.length || x < 0 ? (x + 1200) % 12 : x)

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
			<div
				className="expKeyboardKeyzone"
				id={keyboardZoneId}
				onMouseDown={isLocal ? handleMouseDown : undefined}
				onMouseUp={isLocal ? handleMouseUp : undefined}
			>
				{globalVirtualMidiKeyboard.map((value, index) => {
					return <Key
						key={index}
						index={index}
						virtualMidiKey={value}
						isLocal={isLocal}
						isKeyPressed={pressedKeys.has(index)}
					/>
				})}
			</div>
		</div>
	)
})

function getNoteFromPosition(x: number, y: number) {
	return clamp(Math.floor(x / noteWidth), 0, defaultNumberOfKeys - 1)
}

interface KeyProps {
	index: number
	virtualMidiKey: IVirtualMidiKey
	isLocal: boolean
	isKeyPressed: boolean
}

const Key = React.memo(function _Key({
	index, virtualMidiKey, isLocal, isKeyPressed,
}: KeyProps) {

	const showNoteNames = useSelector((state: IClientAppState) => state.options.showNoteNamesOnKeyboard)

	return (
		// eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
		<div
			// eslint-disable-next-line react/no-array-index-key
			key={index}
			className={`key ${virtualMidiKey.color} ${isKeyPressed ? 'pressed' : 'notPressed'}`}
			style={{pointerEvents: 'none', width: noteWidth, height: noteHeight}}
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
