import React from 'react'
import {useSelector} from 'react-redux'
import {
	selectLocalClientId, selectRoomSettings, IClientAppState, RoomType,
} from '@corgifm/common/redux'
import {ConnectedChat} from './Chat'
import {ConnectedContextMenuContainer} from './ContextMenu/ContextMenuContainer'
import {ModalManager} from './Modal/ModalManager'
import {ConnectedSimpleGraph} from './SimpleGraph/SimpleGraph'
import {ConnectedTopDiv} from './TopDiv'
import {ConnectedSimpleGraphExp} from './SimpleGraph/SimpleGraphExp'

export const ConnectedOnlineApp = function _OnlineApp() {
	const roomSettings = useSelector((state: IClientAppState) => selectRoomSettings(state.room))
	const isLocalClientRoomOwner = useSelector((state: IClientAppState) => selectLocalClientId(state) === roomSettings.ownerId)
	const roomType = useSelector((state: IClientAppState) => state.room.roomInfo.roomType)

	const onlyOwnerCanDoStuff = roomSettings.onlyOwnerCanDoStuff

	return (
		<div
			className={onlyOwnerCanDoStuff && !isLocalClientRoomOwner ? 'restricted' : ''}
			onDragOver={e => e.preventDefault()}
			onDrop={e => e.preventDefault()}
		>
			<ModalManager />
			<ConnectedChat />
			<ConnectedTopDiv />
			{roomType === RoomType.Experimental
				? <ConnectedSimpleGraphExp />
				: <ConnectedSimpleGraph />}
			<ConnectedContextMenuContainer />
		</div>
	)
}
