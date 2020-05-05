import {Map} from 'immutable'
import {Action, AnyAction, Store} from 'redux'
import {rateLimitedDebounce, keyToMidiMap} from '@corgifm/common/common-utils'
import {
	findNodeInfo, globalClockActions,
	IClientAppState, pointersActions,
	selectClientInfo, selectGlobalClockIsPlaying,
	selectIsLocalClientInLimitedMode, selectLocalClient,
	selectPosition, selectSequencer, selectShamuMetaState, sequencerActions,
	userInputActions,
	localActions, localMidiKeyPress, localMidiKeyUp, localMidiOctaveChange,
	windowBlur, selectRoomInfoState, expLocalActions,
	selectLocalClientId, selectRoomMember, selectExpNode,
	roomMemberActions, selectActivityType, selectUserInputKeys,
} from '@corgifm/common/redux'
import {mouseFromScreenToBoard} from './SimpleGlobalClientState'
import {RoomType} from '@corgifm/common/common-types'
import {isInputFocused} from './client-utils'

type IKeyBoardShortcuts = Map<string, KeyBoardShortcut>

interface KeyBoardShortcut {
	actionOnKeyDown?: Action | keyboardActionCreator
	actionOnKeyUp?: Action | keyboardActionCreator
	actionOnKeyPress?: Action | keyboardActionCreator
	allowRepeat: boolean
	preventDefault: boolean
	allowInLimitedMode?: boolean
}

type keyboardActionCreator = (e: KeyboardEvent, state: IClientAppState) => AnyAction | undefined

const midiKeyShortcuts: {[key: string]: KeyBoardShortcut} = {}

keyToMidiMap.forEach((val, key) => {
	midiKeyShortcuts[key] = {
		actionOnKeyDown: localMidiKeyPress(val, 1, 'input events: ' + key),
		actionOnKeyUp: localMidiKeyUp(val, 'input events: ' + key),
		allowRepeat: false,
		preventDefault: true,
	}
})

const Control = 'control'
const Alt = 'alt'
const Shift = 'shift'
const Plus = '+'

const changeOctaveShortcut = (delta: number) => ({
	actionOnKeyDown: localMidiOctaveChange(delta),
	allowRepeat: true,
	preventDefault: true,
})

const keyboardShortcuts: IKeyBoardShortcuts = Map<KeyBoardShortcut>({
	'z': changeOctaveShortcut(-1),
	[Shift + Plus + 'z']: changeOctaveShortcut(-2),
	'-': changeOctaveShortcut(-1),
	[Shift + Plus + '-']: changeOctaveShortcut(-2),
	'x': changeOctaveShortcut(1),
	[Shift + Plus + 'x']: changeOctaveShortcut(2),
	'+': changeOctaveShortcut(1),
	[Shift + Plus + '+']: changeOctaveShortcut(2),
	[Control + Plus + 'z']: {
		actionOnKeyDown: (_, state) => {
			const selectedNodes = selectShamuMetaState(state.room).selectedNodes
			if (selectedNodes.count() !== 1) return
			return findNodeInfo(selectPosition(state.room, selectedNodes.first()).targetType).undoAction(selectedNodes.first())
		},
		allowRepeat: true,
		preventDefault: true,
	},
	[Control + Plus + 'd']: {
		actionOnKeyDown: (_, state) => {
			const selectedNodes = selectShamuMetaState(state.room).selectedNodes
			if (selectActivityType(state.room) === RoomType.Experimental) {
				return localActions.cloneSelectedExpNodes('all')
			} else {
				if (selectedNodes.count() !== 1) return
				const type = selectPosition(state.room, selectedNodes.first()).targetType
				if (findNodeInfo(type).isNodeCloneable !== true) return
				return localActions.cloneNode(selectedNodes.first(), type, 'all')
			}
		},
		allowRepeat: false,
		preventDefault: true,
	},
	[Control + Plus + 'g']: {
		actionOnKeyDown: (_, state) => {
			if (selectActivityType(state.room) !== RoomType.Experimental) return
			const selectedNodes = selectShamuMetaState(state.room).selectedNodes
			return expLocalActions.createGroup(selectedNodes, 'group')
		},
		allowRepeat: false,
		preventDefault: true,
	},
	'PageUp': {
		actionOnKeyDown: (_, state) => {
			if (selectActivityType(state.room) !== RoomType.Experimental) return
			const localClientId = selectLocalClientId(state)
			const currentNodeGroupId = selectRoomMember(state.room, localClientId).groupNodeId
			if (currentNodeGroupId === 'top') return
			const node = selectExpNode(state.room, currentNodeGroupId)
			return roomMemberActions.setNodeGroup(localClientId, node.groupId)
		},
		allowRepeat: false,
		preventDefault: true,
	},
	'r': {
		actionOnKeyDown: (_, state) => {
			const selectedNodes = selectShamuMetaState(state.room).selectedNodes
			if (selectedNodes.count() !== 1) return
			const ownerId = selectPosition(state.room, selectedNodes.first()).ownerId
			if (ownerId.startsWith('dummy')) return
			const sequencer = selectSequencer(state.room, selectedNodes.first())
			return sequencerActions.toggleRecording(selectedNodes.first(), !sequencer.isRecording)
		},
		allowRepeat: false,
		preventDefault: true,
	},
	'b': {
		actionOnKeyDown: userInputActions.localMidiSustainPedal(true),
		actionOnKeyUp: userInputActions.localMidiSustainPedal(false),
		allowRepeat: false,
		preventDefault: true,
	},
	'ArrowRight': {
		actionOnKeyDown: sequencerActions.skipNote(),
		allowRepeat: true,
		preventDefault: true,
	},
	'Backspace': {
		actionOnKeyDown: e => userInputActions.keyPress(e.key),
		allowRepeat: true,
		preventDefault: true,
	},
	' ': {
		actionOnKeyDown: (_, state) => selectGlobalClockIsPlaying(state.room)
			? globalClockActions.stop()
			: globalClockActions.start(),
		allowRepeat: false,
		preventDefault: false,
	},
	// TODO Get it to play nice with better sequencer
	// [Control + Plus + ' ']: {
	// 	actionOnKeyDown: globalClockActions.restart(),
	// 	allowRepeat: false,
	// 	preventDefault: false,
	// },
})
	.merge(midiKeyShortcuts)
	.mapKeys(x => arrayToPlusString(x.toLowerCase().split(Plus).sort()))

function arrayToPlusString(array: readonly string[]): string {
	return array.reduce((result, current) => result + current + Plus, '').replace(/\+$/, '')
}

export function setupInputEventListeners(
	window: Window, store: Store<IClientAppState>, audioContext: AudioContext,
) {
	window.addEventListener('mousedown', async _ => {
		if (audioContext.state === 'suspended') await audioContext.resume()
	})

	window.addEventListener('keydown', async e => {
		if (isInputFocused()) return
		if (audioContext.state === 'suspended') await audioContext.resume()
		onKeyEvent(e)
	})

	window.addEventListener('keyup', e => {
		// Don't block keyup when input is focused, or else music key might get stuck down
		onKeyEvent(e)
	})

	window.addEventListener('keypress', e => {
		if (isInputFocused()) return
		onKeyEvent(e)
	})

	window.addEventListener('blur', () => {
		store.dispatch(windowBlur())
	})

	function onKeyEvent(event: KeyboardEvent) {

		const state = store.getState()
		const {dispatch} = store

		syncModifierKeysState(event)

		let keyCombo = [] as string[]
		if (event.shiftKey) keyCombo.push(Shift)
		if (event.ctrlKey || event.metaKey) keyCombo.push(Control)
		if (event.altKey) keyCombo.push(Alt)
		if (!['Control', 'Alt', 'Shift'].includes(event.key)) keyCombo.push(event.key.toLowerCase())
		let keyComboString = keyCombo.sort().reduce((result, current) => result + current + Plus, '').replace(/\+$/, '')

		const keyboardShortcut = keyboardShortcuts.get(keyComboString)

		if (!keyboardShortcut) return

		if (event.repeat && keyboardShortcut.allowRepeat === false) return

		if (selectIsLocalClientInLimitedMode(state) && keyboardShortcut.allowInLimitedMode !== true) return

		const actionPropToUse = getPropNameForEventType(event.type)
		const action = keyboardShortcut[actionPropToUse]

		if (!action) return

		if (typeof action === 'function') {
			const actualAction = action(event, state)
			if (actualAction !== undefined) {
				dispatch(actualAction)
			}
		} else {
			dispatch(action)
		}

		if (!isInputFocused() && keyboardShortcut.preventDefault) {
			event.preventDefault()
		}
	}

	function syncModifierKeysState(event: KeyboardEvent | MouseEvent) {
		const state = store.getState()
		const {dispatch} = store

		const userInputState = selectUserInputKeys(state)

		if (userInputState.shift !== event.shiftKey ||
			userInputState.alt !== event.altKey ||
			userInputState.ctrl !== event.ctrlKey
		) {
			dispatch(userInputActions.setKeys({
				shift: event.shiftKey,
				alt: event.altKey,
				ctrl: event.ctrlKey,
			}))
		}
	}

	const mouseMoveUpdateIntervalMs = 50

	const onMouseMove = (e: MouseEvent) => {
		dispatchPointersUpdate(e.clientX, e.clientY)
		syncModifierKeysState(e)
	}
	window.addEventListener('mousemove', rateLimitedDebounce(onMouseMove, mouseMoveUpdateIntervalMs))

	const onWheel = (e: MouseWheelEvent) => {
		setTimeout(() => dispatchPointersUpdate(), 0)
		syncModifierKeysState(e)
	}
	window.addEventListener('wheel', rateLimitedDebounce(onWheel, mouseMoveUpdateIntervalMs))

	let lastMousePosition = {
		x: 0,
		y: 0,
	}

	function dispatchPointersUpdate(
		x = lastMousePosition.x, y = lastMousePosition.y
	) {
		const state = store.getState()

		if (selectClientInfo(state).isClientReady !== true) return

		const localClientId = selectLocalClient(state).id

		lastMousePosition = {x, y}

		store.dispatch(pointersActions.update(localClientId, mouseFromScreenToBoard({x, y})))
	}
}

function getPropNameForEventType(eventType: string) {
	switch (eventType) {
		case 'keydown': return 'actionOnKeyDown'
		case 'keyup': return 'actionOnKeyUp'
		case 'keypress': return 'actionOnKeyPress'
		default: throw new Error('unsupported eventType: ' + eventType)
	}
}
