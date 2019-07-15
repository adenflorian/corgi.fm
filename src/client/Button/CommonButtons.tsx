import React, {useCallback} from 'react'
import {IoMdAddCircle} from 'react-icons/io'
import {useDispatch} from 'react-redux'
import {requestCreateRoom} from '../../common/redux'
import {eventNewRoomButtonClick} from '../analytics/analytics'
import {Button} from './Button'

export function NewRoomButton({onClick}: {onClick?: () => any}) {
	const dispatch = useDispatch()
	const handleClick = useCallback(
		() => {
			dispatch(requestCreateRoom())
			eventNewRoomButtonClick()
			if (onClick) onClick()
		},
		[onClick],
	)

	return (
		<Button
			buttonProps={{
				className: 'newRoomButton',
			}}
			onClick={handleClick}
		>
			<IoMdAddCircle /> New Room
		</Button>
	)
}
