import React from 'react'
import {useDispatch} from 'react-redux'
import {Dispatch} from 'redux'
import {
	IClientAppState, ModalId, modalsAction, selectModalsState, shamuConnect,
} from '../../common/redux'
import {AuthModal} from '../Auth/Auth'
import {LoadRoomModalContent} from '../SavingAndLoading/SavingAndLoading'
import {Modal} from './Modal'

type Props = ReturnType<typeof mapStateToProps> & {dispatch: Dispatch}

export interface ModalProps {
	hideModal: Function
}

export function ModalManager({activeModal}: Props) {
	const modalComponent = getModalComponent()
	const dispatch = useDispatch()

	return modalComponent
		? (
			<Modal
				onHide={hideModal}
			>
				{modalComponent}
			</Modal>
		)
		: null

	function getModalComponent() {
		switch (activeModal) {
			case ModalId.LoadRoom:
				return <LoadRoomModalContent {...{hideModal}} />
			case ModalId.Auth:
				return <AuthModal {...{hideModal}} />
			default: return null
		}
	}

	function hideModal() {
		dispatch(modalsAction.set(ModalId.None))
	}
}

function mapStateToProps(state: IClientAppState) {
	return selectModalsState(state)
}

export const ConnectedModalManager = shamuConnect(
	mapStateToProps,
)(ModalManager)
