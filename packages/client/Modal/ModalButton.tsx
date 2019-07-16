import React, {ReactNode, useCallback} from 'react'
import {IconType} from 'react-icons/lib/iconBase'
import {useDispatch} from 'react-redux'
import {ModalId, modalsAction} from '@corgifm/common/redux'
import {Button} from '../Button/Button'

interface Props {
	modalId: ModalId
	label: ReactNode
	icon: IconType
}

export function ModalButton({modalId, label, icon: Icon}: Props) {
	const dispatch = useDispatch()
	const onClick = useCallback(
		() => dispatch(modalsAction.set(modalId)),
		[modalId],
	)

	return (
		<Button
			onClick={onClick}
		>
			<Icon />{label}
		</Button>
	)
}
