import {Map} from 'immutable'
import {Action, AnyAction, Store} from 'redux'
import {rateLimitedDebounce} from '../common/common-utils'
import {
	getConnectionNodeInfo, globalClockActions,
	IClientAppState, pointersActions,
	selectClientInfo, selectGlobalClockIsPlaying, selectLocalClient, selectPosition,
	selectSequencer, selectShamuMetaState, sequencerActions, userInputActions,
} from '../common/redux'
import {
	localMidiKeyPress, localMidiKeyUp, localMidiOctaveChange, windowBlur,
} from './local-middleware'
import {simpleGlobalClientState} from './SimpleGlobalClientState'

type IKeyBoardShortcuts = Map<string, KeyBoardShortcut>

interface KeyBoardShortcut {
	actionOnKeyDown?: Action | keyboardActionCreator
	actionOnKeyUp?: Action | keyboardActionCreator
	actionOnKeyPress?: Action | keyboardActionCreator
	allowRepeat: boolean
	preventDefault: boolean
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

const keyboardShortcuts: IKeyBoardShortcuts = Map<KeyBoardShortcut>({
	'z': {
		actionOnKeyDown: (e, state) => {
			if (e.ctrlKey || e.metaKey) {
				const selectedNodeId = selectShamuMetaState(state.room).selectedNodeId
				if (selectedNodeId === undefined) return
				return getConnectionNodeInfo(selectPosition(state.room, selectedNodeId).targetType).undoAction(selectedNodeId)
			} else {
				return localMidiOctaveChange(e.shiftKey ? -2 : -1)
			}
		},
		allowRepeat: true,
		preventDefault: true,
	},
	'r': {
		actionOnKeyDown: (_, state) => {
			const selectedNodeId = selectShamuMetaState(state.room).selectedNodeId
			if (selectedNodeId === undefined) return
			const sequencer = selectSequencer(state.room, selectedNodeId)
			if (sequencer.ownerId.startsWith('dummy')) return
			return sequencerActions.toggleRecording(selectedNodeId, !sequencer.isRecording)
		},
		allowRepeat: false,
		preventDefault: true,
	},
	'x': {
		actionOnKeyDown: e => localMidiOctaveChange(e.shiftKey ? 2 : 1),
		allowRepeat: true,
		preventDefault: true,
	},
	'-': {
		actionOnKeyDown: e => localMidiOctaveChange(e.shiftKey ? -2 : -1),
		allowRepeat: true,
		preventDefault: true,
	},
	'+': {
		actionOnKeyDown: e => localMidiOctaveChange(e.shiftKey ? 2 : 1),
		allowRepeat: true,
		preventDefault: true,
	},
	'ArrowRight': {
		actionOnKeyDown: () => sequencerActions.skipNote(),
		allowRepeat: true,
		preventDefault: true,
	},
	'Backspace': {
		actionOnKeyDown: e => userInputActions.keyPress(e.key),
		allowRepeat: true,
		preventDefault: true,
	},
	'Control': {
		actionOnKeyDown: userInputActions.setKeys({ctrl: true}),
		actionOnKeyUp: userInputActions.setKeys({ctrl: false}),
		allowRepeat: false,
		preventDefault: false,
	},
	'Alt': {
		actionOnKeyDown: userInputActions.setKeys({alt: true}),
		actionOnKeyUp: userInputActions.setKeys({alt: false}),
		allowRepeat: false,
		preventDefault: false,
	},
	'Shift': {
		actionOnKeyDown: userInputActions.setKeys({shift: true}),
		actionOnKeyUp: userInputActions.setKeys({shift: false}),
		allowRepeat: false,
		preventDefault: false,
	},
	' ': {
		actionOnKeyDown: (e, state) => {
			return e.ctrlKey
				? globalClockActions.restart()
				: selectGlobalClockIsPlaying(state.room)
					? globalClockActions.stop()
					: globalClockActions.start()
		},
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
		const keyboardShortcut = keyboardShortcuts.get(event.key.toLowerCase())

		if (!keyboardShortcut) return
		if (event.repeat && keyboardShortcut.allowRepeat === false) return

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
