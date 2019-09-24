import React from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {AnyFunction} from '@corgifm/common/common-types'
import {
	ModalId, modalsAction, selectActiveModalId,
} from '@corgifm/common/redux'
import {AuthModalContent} from '../Auth/Auth'
import {OptionsModalContent} from '../Options/Options'
import {LoadRoomModalContent} from '../SavingAndLoading/SavingAndLoading'
import {WelcomeModalContent} from '../Welcome/Welcome'
import {NewRoomModalContent} from '../Button/NewRoomButton'
import {Modal} from './Modal'

export interface ModalContent extends React.FunctionComponent<{
	hideModal: AnyFunction
}> {}

export function ModalManager() {
	const dispatch = useDispatch()
	const activeModal = useSelector(selectActiveModalId)
	const modalComponent = getModalComponent()

	return modalComponent
		? (
			<Modal onHide={hideModal}>
				{modalComponent}
			</Modal>
		)
		: null

	function getModalComponent() {
		switch (activeModal) {
			case ModalId.LoadRoom:
				return <LoadRoomModalContent {...{hideModal}} />
			case ModalId.Auth:
				return <AuthModalContent {...{hideModal}} />
			case ModalId.Welcome:
				return <WelcomeModalContent {...{hideModal}} />
			case ModalId.Options:
				return <OptionsModalContent {...{hideModal}} />
			case ModalId.NewRoom:
				return <NewRoomModalContent {...{hideModal}} />
			default: return null
		}
	}

	function hideModal() {
		dispatch(modalsAction.set(ModalId.None))
	}
}
