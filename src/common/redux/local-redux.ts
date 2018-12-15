import {AnyAction} from 'redux'
import {IAppState} from './client-store'

interface ILocalAction extends AnyAction {
	id?: string
}

export const SET_LOCAL_VIRTUAL_KEYBOARD_ID = 'SET_LOCAL_VIRTUAL_KEYBOARD_ID'
export const setLocalVirtualKeyboardId = (id: string) => ({
	type: SET_LOCAL_VIRTUAL_KEYBOARD_ID,
	id,
})

export interface ILocalState {
	localVirtualKeyboardId?: string
}

const initialState: ILocalState = {}

export function localReducer(localState: ILocalState = initialState, action: ILocalAction) {
	switch (action.type) {
		case SET_LOCAL_VIRTUAL_KEYBOARD_ID:
			return {
				...localState,
				localVirtualKeyboardId: action.id,
			}
		default:
			return localState
	}
}

export function selectLocalKeyboardId(state: IAppState) {
	return state.local.localVirtualKeyboardId
}
