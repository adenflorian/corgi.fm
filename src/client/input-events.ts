import {Map} from 'immutable'
import {Action, AnyAction, Store} from 'redux'
import {rateLimitedDebounce} from '../common/common-utils'
import {
	getConnectionNodeInfo, globalClockActions,
	IClientAppState, pointersActions,
	selectClientInfo, selectGlobalClockIsPlaying, selectIsLocalClientInLimitedMode, selectLocalClient,
	selectPosition, selectSequencer, selectShamuMetaState, sequencerActions, userInputActions,
} from '../common/redux'
import {
	localActions, localMidiKeyPress, localMidiKeyUp, localMidiOctaveChange, windowBlur,
} from './local-middleware'
import {simpleGlobalClientState} from './SimpleGlobalClientState'

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

export type IKeyToMidiMap = Map<string, number>

export const keyToMidiMap: IKeyToMidiMap = Map<number>({
	'a': 0,
	'w': 1,
	's': 2,
	'e': 3,
	'd': 4,
	'f': 5,
	't': 6,
	'g': 7,
	'y': 8,
	'h': 9,
	'u': 10,
	'j': 11,
	'k': 12,
	'o': 13,
	'l': 14,
	'p': 15,
	';': 16,
})

keyToMidiMap.forEach((val, key) => {
	midiKeyShortcuts[key] = {
		actionOnKeyDown: localMidiKeyPress(val),
		actionOnKeyUp: localMidiKeyUp(val),
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
			const selectedNode = selectShamuMetaState(state.room).selectedNode
			if (selectedNode === undefined) return
			return getConnectionNodeInfo(selectPosition(state.room, selectedNode.id).targetType).undoAction(selectedNode.id)
		},
		allowRepeat: true,
		preventDefault: true,
	},
	[Control + Plus + 'd']: {
		actionOnKeyDown: (_, state) => {
			const selectedNode = selectShamuMetaState(state.room).selectedNode
			if (selectedNode === undefined) return
			return localActions.cloneNode(selectedNode.id, selectedNode.type, 'all')
		},
		allowRepeat: false,
		preventDefault: true,
	},
	'r': {
		actionOnKeyDown: (_, state) => {
			const selectedNode = selectShamuMetaState(state.room).selectedNode
			if (selectedNode === undefined) return
			const sequencer = selectSequencer(state.room, selectedNode.id)
			if (sequencer.ownerId.startsWith('dummy')) return
			return sequencerActions.toggleRecording(selectedNode.id, !sequencer.isRecording)
		},
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
	// Disabling these until needed again
	// 'Control': {
	// 	actionOnKeyDown: userInputActions.setKeys({ctrl: true}),
	// 	actionOnKeyUp: userInputActions.setKeys({ctrl: false}),
	// 	allowRepeat: false,
	// 	preventDefault: false,
	// },
	// 'Alt': {
	// 	actionOnKeyDown: userInputActions.setKeys({alt: true}),
	// 	actionOnKeyUp: userInputActions.setKeys({alt: false}),
	// 	allowRepeat: false,
	// 	preventDefault: false,
	// },
	// 'Shift': {
	// 	actionOnKeyDown: userInputActions.setKeys({shift: true}),
	// 	actionOnKeyUp: userInputActions.setKeys({shift: false}),
	// 	allowRepeat: false,
	// 	preventDefault: false,
	// },
	' ': {
		actionOnKeyDown: (_, state) => selectGlobalClockIsPlaying(state.room)
			? globalClockActions.stop()
			: globalClockActions.start(),
		allowRepeat: false,
		preventDefault: false,
	},
	[Control + Plus + ' ']: {
		actionOnKeyDown: globalClockActions.restart(),
		allowRepeat: false,
		preventDefault: false,
	},
})
	.merge(midiKeyShortcuts)
	.mapKeys(x => x.toLowerCase())

export function setupInputEventListeners(
	window: Window, store: Store<IClientAppState>, audioContext: AudioContext,
) {
	const isInputFocused = (): boolean => document.activeElement
		? document.activeElement.tagName === 'INPUT'
		: false

	window.addEventListener('mousedown', _ => {
		if (audioContext.state === 'suspended') audioContext.resume()
	})

	window.addEventListener('keydown', e => {
		if (isInputFocused()) return
		if (audioContext.state === 'suspended') audioContext.resume()
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
		const prefix = event.shiftKey
			? Shift + Plus
			: event.ctrlKey || event.metaKey
				? Control + Plus
				: event.altKey
					? Alt + Plus
					: ''

		const keyboardShortcut = keyboardShortcuts.get(prefix + event.key.toLowerCase())

		if (!keyboardShortcut) return

		if (event.repeat && keyboardShortcut.allowRepeat === false) return

		if (selectIsLocalClientInLimitedMode(store.getState()) && keyboardShortcut.allowInLimitedMode !== true) return

		const actionPropToUse = getPropNameForEventType(event.type)
		const action = keyboardShortcut[actionPropToUse]

		if (!action) return

		if (typeof action === 'function') {
			const actualAction = action(event, store.getState())
			if (actualAction !== undefined) {
				store.dispatch(actualAction)
			}
		} else {
			store.dispatch(action)
		}

		if (!isInputFocused() && keyboardShortcut.preventDefault) {
			event.preventDefault()
		}
	}

	const mouseMoveUpdateIntervalMs = 50

	const onMouseMove = (e: MouseEvent) => dispatchPointersUpdate(e.clientX, e.clientY)
	window.addEventListener('mousemove', rateLimitedDebounce(onMouseMove, mouseMoveUpdateIntervalMs))

	const onWheel = () => setTimeout(() => dispatchPointersUpdate(), 0)
	window.addEventListener('wheel', rateLimitedDebounce(onWheel, mouseMoveUpdateIntervalMs))

	let lastMousePosition = {
		x: 0,
		y: 0,
	}

	function dispatchPointersUpdate(x?: number, y?: number) {
		const state = store.getState()

		if (selectClientInfo(state).isClientReady !== true) return

		const localClientId = selectLocalClient(state).id

		if (!x || !y) {
			x = lastMousePosition.x
			y = lastMousePosition.y
		} else {
			lastMousePosition = {x, y}
		}

		const {pan, zoom} = simpleGlobalClientState

		store.dispatch(pointersActions.update(localClientId, {
			x: ((x - (window.innerWidth / 2)) / zoom) - pan.x,
			y: ((y - (window.innerHeight / 2)) / zoom) - pan.y,
		}))
	}
}

function getPropNameForEventType(eventType: string) {
	switch (eventType) {
		case 'keydown': return 'actionOnKeyDown'
		case 'keyup': return 'actionOnKeyUp'
		case 'keypress': return 'actionOnKeyPress'
	}
	throw new Error('unsupported eventType: ' + eventType)
}
