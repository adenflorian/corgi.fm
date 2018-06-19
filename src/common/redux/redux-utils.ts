export function makeActionCreator(type, ...argNames) {
	return (...args) => {
		const action = {type}
		argNames.forEach((arg, index) => {
			action[arg] = args[index]
		})
		return action
	}
}

export function makeBroadcaster(actionCreator: any) {
	return (...args) => ({...actionCreator(...args), shouldBroadcast: true})
}

export function createReducer(initialState, handlers) {
	return function reducer(state = initialState, action) {
		if (handlers.hasOwnProperty(action.type)) {
			return handlers[action.type](state, action)
		} else {
			return state
		}
	}
}
