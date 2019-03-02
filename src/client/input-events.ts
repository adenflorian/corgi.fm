import {Map} from 'immutable'
import {Action, AnyAction, Store} from 'redux'
import {
	globalClockActions, IClientAppState, localMidiKeyPress, localMidiKeyUp,
	localMidiOctaveChange, pointersActions,
	selectGlobalClockIsPlaying, selectIsLocalClientReady, selectLocalClient,
	skipNote, undoRecordingSequencer, userInputActions,
} from '../common/redux'
import {simpleGlobalClientState} from './SimpleGlobalClientState'

type IKeyBoardShortcuts = Map<string, KeyBoardShortcut>

interface KeyBoardShortcut {
	actionOnKeyDown?: Action | keyboardActionCreator
	actionOnKeyUp?: Action | keyboardActionCreator
	actionOnKeyPress?: Action | keyboardActionCreator
	allowRepeat: boolean
	preventDefault: boolean
}

type keyboardActionCreator = (e: KeyboardEvent, state: IClientAppState) => AnyAction

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
		actionOnKeyDown: e => localMidiOctaveChange(e.shiftKey ? -2 : -1),
		allowRepeat: true,
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
		actionOnKeyDown: () => skipNote(),
		allowRepeat: true,
		preventDefault: true,
	},
	'Backspace': {
		actionOnKeyDown: () => undoRecordingSequencer(),
		allowRepeat: false,
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
		actionOnKeyPress: (e, state) => {
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

	function onKeyEvent(event: KeyboardEvent) {
		const keyboardShortcut = keyboardShortcuts.get(event.key.toLowerCase())

		if (!keyboardShortcut) return
		if (event.repeat && keyboardShortcut.allowRepeat === false) return

		const actionPropToUse = getPropNameForEventType(event.type)
		const action = keyboardShortcut[actionPropToUse]

		if (!action) return

		if (typeof action === 'function') {
			store.dispatch(action(event, store.getState()))
		} else {
			store.dispatch(action)
		}

		if (!isInputFocused() && keyboardShortcut.preventDefault) {
			event.preventDefault()
		}
	}

	window.addEventListener('mousemove', e => sendMouseUpdate(e.clientX, e.clientY))

	window.addEventListener('wheel', _ => setTimeout(() => sendMouseUpdate(), 0))

	let lastMousePosition = {
		x: 0,
		y: 0,
	}

	function sendMouseUpdate(x?: number, y?: number) {
		const state = store.getState()

		if (!selectIsLocalClientReady(state)) return

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
