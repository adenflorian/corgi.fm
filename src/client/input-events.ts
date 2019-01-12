import {Map} from 'immutable'
import {AnyAction, Store} from 'redux'
import {selectIsLocalClientReady, selectLocalClient, setClientPointer} from '../common/redux/clients-redux'
import {localMidiKeyPress, localMidiKeyUp, localMidiOctaveChange} from '../common/redux/local-middleware'
import {getMainBoardsRectY} from './utils'

type IKeyBoardShortcuts = Map<string, KeyBoardShortcut>

const KeyBoardShortcuts = Map

interface KeyBoardShortcut {
	actionOnKeyDown?: AnyAction | keyboardActionCreator
	actionOnKeyUp?: AnyAction | keyboardActionCreator
	actionOnKeyPress?: AnyAction | keyboardActionCreator
	allowRepeat: boolean
	preventDefault: boolean
}

type keyboardActionCreator = (e: KeyboardEvent) => AnyAction

const other: any = {}

export type IKeyToMidiMap = Map<string, number>

const KeyToMidiMap = Map

export const keyToMidiMap: IKeyToMidiMap = KeyToMidiMap({
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
	other[key] = {
		actionOnKeyDown: localMidiKeyPress(val),
		actionOnKeyUp: localMidiKeyUp(val),
		allowRepeat: false,
		preventDefault: true,
	}
})

const keyboardShortcuts: IKeyBoardShortcuts = KeyBoardShortcuts({
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
	...other,
})

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
		const halfWidth = document.body.scrollWidth / 2
		const distanceFromCenterX = mouseX - halfWidth + window.scrollX
		const distanceFromBoardsTop = mouseY - getMainBoardsRectY()
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
