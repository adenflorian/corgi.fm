import {Map} from 'immutable'
import {Action, AnyAction, Store} from 'redux'
import {selectIsLocalClientReady, selectLocalClient, setClientPointer, userInputActions} from '../common/redux'
import {skipNote} from '../common/redux'
import {localMidiKeyPress, localMidiKeyUp, localMidiOctaveChange} from '../common/redux'
import {simpleGlobalClientState} from './SimpleGlobalClientState'
import {getMainBoardsRectX, getMainBoardsRectY} from './utils'

type IKeyBoardShortcuts = Map<string, KeyBoardShortcut>

interface KeyBoardShortcut {
	actionOnKeyDown?: Action | keyboardActionCreator
	actionOnKeyUp?: Action | keyboardActionCreator
	actionOnKeyPress?: Action | keyboardActionCreator
	allowRepeat: boolean
	preventDefault: boolean
}

type keyboardActionCreator = (e: KeyboardEvent) => AnyAction

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
		actionOnKeyDown: (e: KeyboardEvent) => localMidiOctaveChange(e.shiftKey ? -2 : -1),
		allowRepeat: true,
		preventDefault: true,
	},
	'x': {
		actionOnKeyDown: (e: KeyboardEvent) => localMidiOctaveChange(e.shiftKey ? 2 : 1),
		allowRepeat: true,
		preventDefault: true,
	},
	'-': {
		actionOnKeyDown: (e: KeyboardEvent) => localMidiOctaveChange(e.shiftKey ? -2 : -1),
		allowRepeat: true,
		preventDefault: true,
	},
	'+': {
		actionOnKeyDown: (e: KeyboardEvent) => localMidiOctaveChange(e.shiftKey ? 2 : 1),
		allowRepeat: true,
		preventDefault: true,
	},
	' ': {
		actionOnKeyDown: () => skipNote(),
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
})
	.merge(midiKeyShortcuts)
	.mapKeys(x => x.toLowerCase())

let lastScrollY = window.scrollY

export function setupInputEventListeners(window: Window, store: Store, audioContext: AudioContext) {

	const isInputFocused = (): boolean => document.activeElement ? document.activeElement.tagName === 'INPUT' : false

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

	function onKeyEvent(event: KeyboardEvent) {
		const keyboardShortcut = keyboardShortcuts.get(event.key.toLowerCase())

		if (!keyboardShortcut) return
		if (event.repeat && keyboardShortcut.allowRepeat === false) return

		const actionPropToUse = getPropNameForEventType(event.type)
		const action = keyboardShortcut[actionPropToUse]

		if (!action) return

		if (typeof action === 'function') {
			store.dispatch(action(event))
		} else {
			store.dispatch(action)
		}

		if (!isInputFocused() && keyboardShortcut.preventDefault) {
			event.preventDefault()
		}
	}

	window.addEventListener('mousemove', e => {
		const state = store.getState()
		if (selectIsLocalClientReady(state)) {
			const localClient = selectLocalClient(state)
			sendMouseUpdate(e.clientX, e.clientY, localClient.id)
		}
	})

	function sendMouseUpdate(mouseX: number, mouseY: number, localClientId: string) {
		const distanceFromCenterX = (mouseX - getMainBoardsRectX()) / simpleGlobalClientState.zoom

		const distanceFromBoardsTop = (mouseY - getMainBoardsRectY()) / simpleGlobalClientState.zoom

		store.dispatch(setClientPointer(localClientId, {
			distanceFromCenterX,
			distanceFromBoardsTop,
		}))
	}

	window.addEventListener('scroll', _ => {
		const scrollDelta = window.scrollY - lastScrollY
		lastScrollY = window.scrollY
		const state = store.getState()
		if (selectIsLocalClientReady(state)) {
			const localClient = selectLocalClient(state)
			store.dispatch(setClientPointer(localClient.id, {
				distanceFromCenterX: localClient.pointer.distanceFromCenterX,
				distanceFromBoardsTop: localClient.pointer.distanceFromBoardsTop + scrollDelta,
			}))
		}
	})
}

function getPropNameForEventType(eventType: string) {
	switch (eventType) {
		case 'keydown': return 'actionOnKeyDown'
		case 'keyup': return 'actionOnKeyUp'
		case 'keypress': return 'actionOnKeyPress'
	}
	throw new Error('unsupported eventType: ' + eventType)
}
