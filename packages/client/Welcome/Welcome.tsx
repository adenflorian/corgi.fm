import React, {useCallback} from 'react'
import {IoMdArrowRoundForward, IoMdGlobe} from 'react-icons/io'
import {useDispatch, useSelector} from 'react-redux'
import {lobby} from '@corgifm/common/common-constants'
import {
	changeRoom, ModalId, modalsAction, selectActiveRoom,
} from '@corgifm/common/redux'
import {Button} from '../Button/Button'
import {NewRoomButton} from '../Button/NewRoomButton'
import {DiscordLink, NewsletterLink, PatreonLink} from '../Links'
import {ModalContent} from '../Modal/ModalManager'
import {ConnectedNameChanger} from '../NameChanger'
import {LoadRoomModalButton} from '../SavingAndLoading/SavingAndLoading'
import './Welcome.less'

export function WelcomeModalButton() {
	const dispatch = useDispatch()
	const showModal = useCallback(
		() => dispatch(modalsAction.set(ModalId.Welcome)),
		[dispatch],
	)

	return (
		<Button onClick={showModal} background="medium" shadow={true}>
			Show Welcome
		</Button>
	)
}

export const WelcomeModalContent: ModalContent = ({hideModal}) => {
	const activeRoom = useSelector(selectActiveRoom)
	const dispatch = useDispatch()
	const joinLobby = useCallback(() => {
		dispatch(changeRoom(lobby))
		hideModal()
	}, [dispatch, hideModal])

	return (
		<div className="welcomeModal">
			<div className="modalSection login">
				<div className="modalSectionLabel">
					Welcome to corgi.fm!
				</div>
				<div className="modalSectionSubLabel">
					Collaborative Online Real-time Graphical Interface For Music
				</div>
				<div className="modalSectionContent">
					<div className="first">
						<div className="name">
							<label htmlFor="usernameInput">Username</label>
							<ConnectedNameChanger />
						</div>
					</div>
					<div className="left">
						<div className="roomActions vert-space-16">
							<button
								type="button"
								className="joinActiveRoom"
								onClick={hideModal}
							>
								<IoMdArrowRoundForward />
								<span>Continue to room&nbsp;</span>
								<span className="room">{activeRoom}</span>
							</button>
							{activeRoom !== lobby && (
								<button
									type="button"
									className="joinLobby"
									onClick={joinLobby}
								>
									<IoMdGlobe />
									<span>Join&nbsp;</span>
									<span className="room">lobby</span>
								</button>
							)}
							<NewRoomButton onClick={hideModal} />
							<LoadRoomModalButton />
						</div>
					</div>
					<div className="right">
						<div className="links vert-space-16">
							<DiscordLink />
							<PatreonLink />
							<NewsletterLink />
						</div>
					</div>
				</div>
				<div className="modalSectionFooter">
					Remember to take a break and stretch every now and then!
				</div>
			</div>
		</div>
	)
}
