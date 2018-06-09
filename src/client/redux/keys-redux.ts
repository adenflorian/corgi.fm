export function keysReducer(state = {}, action) {
	switch (action.type) {
		case 'KEY_DOWN':
			return {...state, [action.e.key]: true}
		case 'KEY_UP':
			return {...state, [action.e.key]: false}
		default:
			return state
	}
}
