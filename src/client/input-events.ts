import {AnyAction, Store} from 'redux'
import {localMidiKeyPress, localMidiKeyUp, localMidiOctaveChange} from '../common/redux/local-middleware'

interface KeyBoardShortcuts {
	[key: string]: KeyBoardShortcut
}

interface KeyBoardShortcut {
	actionOnKeyDown?: AnyAction | keyboardActionCreator
	actionOnKeyUp?: AnyAction | keyboardActionCreator
	actionOnKeyPress?: AnyAction | keyboardActionCreator
	allowRepeat: boolean
	preventDefault: boolean
}

type keyboardActionCreator = (e: KeyboardEvent) => AnyAction

const keyboardShortcuts: KeyBoardShortcuts = {
	// ' ': {
	// 	actionOnKeyDown: togglePlaySimpleTrack(),
	// 	allowRepeat: false,
	// 	preventDefault: true,
	// },
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
}

export const keyToMidiMap = {
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
}

Object.keys(keyToMidiMap).forEach(key => {
	keyboardShortcuts[key] = {
		actionOnKeyDown: localMidiKeyPress(keyToMidiMap[key]),
		actionOnKeyUp: localMidiKeyUp(keyToMidiMap[key]),
		allowRepeat: false,
		preventDefault: true,
	}
})

export function setupInputEventListeners(window: Window, store: Store) {
	window.addEventListener('keydown', e => {
		foo(e)
	})

	window.addEventListener('keyup', e => {
		foo(e)
	})

	window.addEventListener('keypress', e => {
		foo(e)
	})

	function foo(event: KeyboardEvent) {
		const keyboardShortcut = keyboardShortcuts[event.key.toLowerCase()]

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

		if (keyboardShortcut.preventDefault) {
			event.preventDefault()
		}
	}
}

function getPropNameForEventType(eventType: string) {
	switch (eventType) {
		case 'keydown': return 'actionOnKeyDown'
		case 'keyup': return 'actionOnKeyUp'
		case 'keypress': return 'actionOnKeyPress'
	}
}
