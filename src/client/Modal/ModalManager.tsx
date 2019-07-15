import React from 'react'
import {Dispatch} from 'redux'
import {
	IClientAppState, ModalId, modalsAction, selectModalsState, shamuConnect,
} from '../../common/redux'
import {LoadRoomModalContent} from '../SavingAndLoading/SavingAndLoading'
import {Modal} from './Modal'

type Props = ReturnType<typeof mapStateToProps> & {dispatch: Dispatch}

export function ModalManager(props: Props) {
	const modalComponent = getModalComponent(props)

	return modalComponent
		? (
			<Modal
				onHide={() => props.dispatch(modalsAction.set(ModalId.None))}
			>
				{modalComponent}
			</Modal>
		)
		: null
}

function getModalComponent({activeModal, dispatch}: Props) {
	switch (activeModal) {
		case ModalId.LoadRoom:
			return <LoadRoomModalContent dispatch={dispatch} />
		default: return null
	}
}

function mapStateToProps(state: IClientAppState) {
	return selectModalsState(state)
}

export const ConnectedModalManager = shamuConnect(
	mapStateToProps,
)(ModalManager)
