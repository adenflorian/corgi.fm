import React from 'react'
import {useSelector} from 'react-redux'
import {
	selectLocalClientId, selectRoomSettings, IClientAppState,
} from '@corgifm/common/redux'
import {ConnectedChat} from './Chat'
import {ConnectedContextMenuContainer} from './ContextMenu/ContextMenuContainer'
import {ModalManager} from './Modal/ModalManager'
import {ConnectedSimpleGraph} from './SimpleGraph/SimpleGraph'
import {ConnectedTopDiv} from './TopDiv'
import {ConnectedSimpleGraphExp} from './SimpleGraph/SimpleGraphExp'
import {useRoomType} from './react-hooks'
import {RoomType} from '@corgifm/common/common-types'

export const ConnectedOnlineApp = function _OnlineApp() {
	const roomSettings = useSelector((state: IClientAppState) => selectRoomSettings(state.room))
	const isLocalClientRoomOwner = useSelector((state: IClientAppState) => selectLocalClientId(state) === roomSettings.ownerId)
	const roomType = useRoomType()

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
