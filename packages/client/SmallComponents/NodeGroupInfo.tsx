import React, {useCallback} from 'react'
import {useDispatch, useStore} from 'react-redux'
import {roomMemberActions, selectLocalClientId, selectExpNode, IClientAppState} from '@corgifm/common/redux'
import {useLocalRoomMember} from '../react-hooks'

export const NodeGroupInfo = React.memo(function _NodeGroupInfo() {
	const store = useStore<IClientAppState>()
	const dispatch = useDispatch()
	const localRoomMember = useLocalRoomMember()

	const navigateUpGroup = useCallback(() => {
		if (localRoomMember.groupNodeId === 'top') return
		const state = store.getState()
		const localClientId = selectLocalClientId(state)
		const node = selectExpNode(state.room, localRoomMember.groupNodeId)
		dispatch(roomMemberActions.setNodeGroup(localClientId, node.groupId))
	}, [dispatch, localRoomMember.groupNodeId, store])

	return (
		<div className="blob">
			<div className="blobDark">Node Group</div>
			<div>
				{localRoomMember.groupNodeId.substring(0, 8)}
			</div>
			{localRoomMember.groupNodeId !== 'top' &&
				<button
					className="blobDark"
					onClick={navigateUpGroup}
				>
					Up
				</button>
			}
		</div>
	)
})
