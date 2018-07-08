import {AnyAction, Store} from 'redux'
import {selectLocalClient, setClientPointer} from '../common/redux/clients-redux'
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

let lastScrollY = window.scrollY

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

	window.addEventListener('mousemove', e => {
		const state = store.getState()
		const localClient = selectLocalClient(state)
		if (localClient && localClient.id) {
			sendMouseUpdate(e.clientX, e.clientY, localClient.id)
		}
	})

	window.addEventListener('scroll', e => {
		const scrollDelta = window.scrollY - lastScrollY
		lastScrollY = window.scrollY
		const localClient = selectLocalClient(store.getState())
		if (localClient && localClient.id) {
			store.dispatch(setClientPointer(localClient.id, {
				distanceFromCenterX: localClient.pointer.distanceFromCenterX,
				distanceFromBoardsTop: localClient.pointer.distanceFromBoardsTop + scrollDelta,
			}))
		}
	})

	function sendMouseUpdate(mouseX, mouseY, localClientId) {
		const halfWidth = document.body.clientWidth / 2
		const distanceFromCenterX = mouseX - halfWidth
		const mainBoardsRect: any = document.getElementById('mainBoards').getBoundingClientRect()
		const mainBoardsTop = mainBoardsRect.y
		const distanceFromBoardsTop = mouseY - mainBoardsTop
		store.dispatch(setClientPointer(localClientId, {
			distanceFromCenterX,
			distanceFromBoardsTop,
		}))
	}

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
