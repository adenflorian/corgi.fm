import React, {useCallback, Fragment, useRef, useEffect} from 'react'
import animal from 'animal-id'
import {List} from 'immutable'
import {IoMdAddCircle} from 'react-icons/io'
import {useDispatch} from 'react-redux'
import {roomsActions, modalsAction, ModalId, RoomType, isRoomType} from '@corgifm/common/redux'
import {roomNameCleaner} from '@corgifm/common/common-utils'
import {eventNewRoomButtonClick} from '../analytics/analytics'
import {ModalContent} from '../Modal/ModalManager'
import {useBoolean, useInputState, useEnumInputState} from '../react-hooks'
import {Select} from '../Select/Select'
import {isLocalDevClient} from '../is-prod-client'
import {Button} from './Button'

export function NewRoomButton({onClick}: {onClick?: () => any}) {
	const dispatch = useDispatch()
	const showModal = useCallback(
		() => dispatch(modalsAction.set(ModalId.NewRoom)),
		[dispatch],
	)

	return (
		<Fragment>
			<Button
				buttonProps={{
					className: 'newRoomButton',
				}}
				onClick={() => {
					onClick && onClick()
					showModal()
				}}
				background="medium"
				shadow={true}
			>
				<IoMdAddCircle />
				New Room
			</Button>
		</Fragment>
	)
}

export const NewRoomModalContent: ModalContent = ({hideModal}) => {
	const [name, setName] = useInputState(animal.getId())
	const [type, setType] = useEnumInputState(RoomType.Normal, isRoomType)
	const [inputsDisabled, disableInputs] = useBoolean(false)
	const dispatch = useDispatch()
	const nameInputRef = useRef<HTMLInputElement>(null)

	const handleSubmit = useCallback((e: React.FormEvent) => {
		e.preventDefault()
		disableInputs()
		dispatch(roomsActions.requestCreate(roomNameCleaner(name), type))
		eventNewRoomButtonClick()
		hideModal()
	}, [disableInputs, dispatch, hideModal, name, type])

	useEffect(() => {
		const nameInputElement = nameInputRef.current
		if (nameInputElement) {
			nameInputElement.select()
		}
	}, [])

	return (
		<Fragment>
			<div className="modalSection newRoomModal">
				<div className="modalSectionLabel">New Room</div>
				<div className="modalSectionSubLabel">
					{`You can also do this: "corgi.fm/my-new-room"`}
				</div>
				<div className="modalSectionContent">
					<form onSubmit={handleSubmit}>
						<input
							ref={nameInputRef}
							type="text"
							placeholder="Room Name"
							className="roomName"
							value={name}
							onChange={setName}
							disabled={inputsDisabled}
							required
						/>
						{isLocalDevClient() && <Select
							label="Room Type"
							name="roomType"
							onChange={setType}
							options={List(Object.keys(RoomType))}
							value={type}
							disabled={inputsDisabled}
							required
						/>}
						<div className="submitRow">
							<input
								type="submit"
								className="button createRoom"
								value="Create Room"
								disabled={inputsDisabled}
							/>
						</div>
					</form>
				</div>
			</div>
		</Fragment>
	)
}
