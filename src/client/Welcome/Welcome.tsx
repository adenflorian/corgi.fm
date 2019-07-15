import {useCallback} from 'react'
import React from 'react'
import {IoMdPeople} from 'react-icons/io'
import {useDispatch} from 'react-redux'
import {ModalId, modalsAction} from '../../common/redux'
import {Button} from '../Button/Button'
import {NewRoomButton} from '../Button/CommonButtons'
import {DiscordLink, NewsletterLink, PatreonLink} from '../Links'
import {ModalContent} from '../Modal/ModalManager'
import {ConnectedNameChanger} from '../NameChanger'
import {LoadRoomModalButton} from '../SavingAndLoading/SavingAndLoading'
import './Welcome.less'

export function WelcomeModalButton() {
	const dispatch = useDispatch()
	const showModal = useCallback(
		() => dispatch(modalsAction.set(ModalId.Welcome)),
		[],
	)

	return (
		<Button onClick={showModal}>
			Show Welcome
		</Button>
	)
}

export const WelcomeModalContent: ModalContent = ({hideModal}) => {
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
								className="joinLobby"
								onClick={hideModal}
							>
								<IoMdPeople /> Join Lobby
							</button>
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
