import {Store} from 'redux'
// import {VIRTUAL_KEY_PRESSED} from './redux/virtual-keyboard-redux'

// const bindings = {
// 	a: {
// 		type: VIRTUAL_KEY_PRESSED,
// 		args: [
// 			'me',
// 			0,
// 		],
// 	},
// }

export function setupInputEventListeners(window: Window, store: Store) {
	window.addEventListener('keydown', e => {
		if (e.repeat) return

		store.dispatch({
			type: 'KEY_DOWN',
			e,
		})
	})

	window.addEventListener('keyup', e => {
		store.dispatch({
			type: 'KEY_UP',
			e,
		})
	})
}
