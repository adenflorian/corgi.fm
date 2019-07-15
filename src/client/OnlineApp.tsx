import React from 'react'
import {selectLocalClientId, selectRoomSettings, shamuConnect} from '../common/redux'
import {ConnectedChat} from './Chat'
import {ConnectedContextMenuContainer} from './ContextMenu/ContextMenuContainer'
import {ConnectedModalManager} from './Modal/ModalManager'
import {ConnectedSimpleGraph} from './SimpleGraph/SimpleGraph'
import {ConnectedTopDiv} from './TopDiv'

interface IOnlineAppProps {}

interface ReduxProps {
	onlyOwnerCanDoStuff: boolean
	isLocalClientRoomOwner: boolean
}

type AllProps = IOnlineAppProps & ReduxProps

export class OnlineApp extends React.PureComponent<AllProps> {
	public render() {
		return (
			<div className={this.props.onlyOwnerCanDoStuff && !this.props.isLocalClientRoomOwner ? 'restricted' : ''}>
				<ConnectedModalManager />
				<ConnectedChat />
				<ConnectedTopDiv />
				<ConnectedSimpleGraph />
				<ConnectedContextMenuContainer />
			</div>
		)
	}
}

export const ConnectedOnlineApp = shamuConnect(
	(state): ReduxProps => {
		const roomSettings = selectRoomSettings(state.room)

		return {
			isLocalClientRoomOwner: selectLocalClientId(state) === roomSettings.ownerId,
			onlyOwnerCanDoStuff: roomSettings.onlyOwnerCanDoStuff,
		}
	},
)(OnlineApp)
