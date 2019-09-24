import {ActionType} from 'typesafe-actions'
import {IClientAppState} from '.'

export const modalsAction = {
	set: (modalId: ModalId) => ({
		type: 'SET_ACTIVE_MODAL',
		modalId,
	} as const),
} as const

const makeModalsState = () => ({
	activeModal: ModalId.Welcome as ModalId,
} as const)

type ModalsState = ReturnType<typeof makeModalsState>

export enum ModalId {
	Auth = 'Auth',
	Welcome = 'Welcome',
	Options = 'Options',
	LoadRoom = 'LoadRoom',
	NewRoom = 'NewRoom',
	None = 'None',
}

export type ModalsAction = ActionType<typeof modalsAction>

const initialState = makeModalsState()

export function modalsReducer(
	state = initialState, action: ModalsAction,
): ModalsState {

	switch (action.type) {
		case 'SET_ACTIVE_MODAL': return {...state, activeModal: action.modalId}
		default: return state
	}
}

export const selectModalsState = (state: IClientAppState) =>
	state.modals

export const selectActiveModalId = (state: IClientAppState) =>
	state.modals.activeModal
