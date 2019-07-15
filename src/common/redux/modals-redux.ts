import {ActionType} from 'typesafe-actions'
import {IClientAppState} from '.'

export const SET_ACTIVE_MODAL = 'SET_ACTIVE_MODAL'

export const modalsAction = Object.freeze({
	set: (modalId: ModalId) => ({
		type: SET_ACTIVE_MODAL as typeof SET_ACTIVE_MODAL,
		modalId,
	}),
})

const makeModalsState = () => Object.freeze({
	activeModal: ModalId.None,
})

type ModalsState = ReturnType<typeof makeModalsState>

export enum ModalId {
	Auth = 'Auth',
	Welcome = 'Welcome',
	Options = 'Options',
	LoadRoom = 'LoadRoom',
	None = 'None',
}

export type ModalsAction = ActionType<typeof modalsAction>

const initialState = makeModalsState()

export function modalsReducer(
	state = initialState, action: ModalsAction,
): ModalsState {

	switch (action.type) {
		case SET_ACTIVE_MODAL: return {...state, activeModal: action.modalId}
		default: return state
	}
}

export const selectModalsState = (state: IClientAppState) =>
	state.modals
