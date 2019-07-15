import React from 'react'
import {
	IoMdAdd as AddIcon,
} from 'react-icons/io'
import {Dispatch} from 'redux'
import {requestCreateRoom} from '../../common/redux'
import {eventNewRoomButtonClick} from '../analytics/analytics'
import {Button} from './Button'

export function NewRoomButton({dispatch}: {dispatch: Dispatch}) {
	return (
		<Button
			buttonProps={{
				className: 'newRoomButton',
				onClick: () => {
					dispatch(requestCreateRoom())
					eventNewRoomButtonClick()
				},
			}}
		>
			<AddIcon /> New Room
		</Button>
	)
}
