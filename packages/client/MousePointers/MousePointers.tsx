import React from 'react'
import {connect} from 'react-redux'
import {
	IClientAppState,
	selectLocalClientId, selectRoomMemberState, RoomMembers,
} from '@corgifm/common/redux'
import {ConnectedMousePointer} from './MousePointer'

interface Props {
	readonly roomMembers: RoomMembers
	readonly localClientId: ClientId
}

export const MousePointers: React.FC<Props> =
	React.memo(function _MousePointers({roomMembers, localClientId}) {
		return (
			<div className="pointers">
				{roomMembers
					.filter(x => x.id !== localClientId)
					.map(member =>
						<ConnectedMousePointer
							key={member.id as string}
							clientId={member.id}
						/>,
					).toList()
				}
			</div>
		)
	})

const mapStateToProps = (state: IClientAppState): Props => {
	return {
		roomMembers: selectRoomMemberState(state.room),
		localClientId: selectLocalClientId(state),
	}
}

export const ConnectedMousePointers = connect(mapStateToProps)(MousePointers)
