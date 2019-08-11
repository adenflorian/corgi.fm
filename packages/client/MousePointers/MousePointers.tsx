import {List} from 'immutable'
import React from 'react'
import {connect} from 'react-redux'
import {
	IClientAppState, selectAllOtherRoomMemberIds,
} from '@corgifm/common/redux'
import {ConnectedMousePointer} from './MousePointer'

interface IMousePointersViewProps {
	clientIds: List<Id>
}

export const MousePointers: React.FC<IMousePointersViewProps> =
	React.memo(function _MousePointers({clientIds}) {
		return (
			<div className="pointers">
				{clientIds
					.map(clientId =>
						<ConnectedMousePointer
							key={clientId.toString()}
							clientId={clientId}
						/>,
					)
				}
			</div>
		)
	})

const mapStateToProps = (state: IClientAppState): IMousePointersViewProps => {
	return {
		clientIds: selectAllOtherRoomMemberIds(state),
	}
}

export const ConnectedMousePointers = connect(mapStateToProps)(MousePointers)
