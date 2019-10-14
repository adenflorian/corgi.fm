import {AnyAction} from 'redux'

export interface OtherState {
	lastAction: AnyAction
}

const initialState: OtherState = {
	lastAction: {type: '$%$%$%'},
}

export const otherReducer = (state = initialState, action: AnyAction): OtherState => {
	return {
		...state,
		lastAction: action,
	}
}
