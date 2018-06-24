import {ActionCreator, AnyAction} from 'redux'

export function makeActionCreator(type, ...argNames) {
	argNames.forEach(arg => {
		if (arg === 'type') {
			throw new Error(`can't make arg name *type*, because it's reserved for the action type`)
		}
	})
	return (...args) => {
		const action = {type}
		argNames.forEach((arg, index) => {
			action[arg] = args[index]
		})
		return action
	}
}

export function makeBroadcaster(actionCreator: ActionCreator<AnyAction>): ActionCreator<AnyAction> {
	return (...args) => ({...actionCreator(...args), shouldBroadcast: true})
}

export function makeServerAction(actionCreator: ActionCreator<AnyAction>): ActionCreator<AnyAction> {
	return (...args) => ({...actionCreator(...args), dispatchOnServer: true})
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
