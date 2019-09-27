import React from 'react'
import {useSelector} from 'react-redux'
import {
	selectLocalClientId, selectRoomSettings, IClientAppState,
} from '@corgifm/common/redux'
import {ConnectedChat} from '../Chat'
import {ConnectedContextMenuContainer} from '../ContextMenu/ContextMenuContainer'
import {ModalManager} from '../Modal/ModalManager'
import {ConnectedTopDiv} from '../TopDiv'
import {ExperimentalGraph} from './ExperimentalGraph'

export const ExperimentalApp = function _ExperimentalApp() {
	const roomSettings = useSelector((state: IClientAppState) => selectRoomSettings(state.room))
	const isLocalClientRoomOwner = useSelector((state: IClientAppState) => selectLocalClientId(state) === roomSettings.ownerId)
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
			<ExperimentalGraph />
			<ConnectedContextMenuContainer />
		</div>
	)
}
