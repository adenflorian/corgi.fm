import {Store} from 'redux'
import {IAppState} from './redux/configureStore'
import {
	decreaseVirtualOctave,
	increaseVirtualOctave,
	virtualKeyPressed,
	virtualKeyUp,
} from './redux/virtual-keyboard-redux'

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

export function setupInputEventListeners(window: Window, store: Store) {
	window.addEventListener('keydown', e => {
		onKeyDown(e.key.toLowerCase(), e.repeat)
	})

	window.addEventListener('keyup', e => {
		onKeyUp(e.key.toLowerCase())
	})

	function onKeyDown(keyName, isRepeat: boolean) {
		const state: IAppState = store.getState()
		const myClientId = state.websocket.myClientId

		if (isMidiKey(keyName) && !isRepeat) {
			const midiKeyNumber = keyToMidiMap[keyName]
			store.dispatch(virtualKeyPressed(myClientId, midiKeyNumber))
		} else {
			switch (keyName) {
				case 'x': return store.dispatch(increaseVirtualOctave(myClientId))
				case 'z': return store.dispatch(decreaseVirtualOctave(myClientId))
				default: return
			}
		}
	}

	function onKeyUp(keyName) {
		if (isMidiKey(keyName) === false) return

		const midiKeyNumber = keyToMidiMap[keyName]

		const state: IAppState = store.getState()

		store.dispatch(virtualKeyUp(state.websocket.myClientId, midiKeyNumber))
	}
}

export function isMidiKey(keyName: string) {
	return Object.keys(keyToMidiMap).some(x => x === keyName.toLowerCase())
}
