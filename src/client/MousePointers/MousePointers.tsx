import {List} from 'immutable'
import * as React from 'react'
import {connect} from 'react-redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {selectAllOtherRoomMemberIds} from '../../common/redux/room-members-redux'
import {ConnectedMousePointer} from './MousePointer'

interface IMousePointersViewProps {
	clientIds: List<string>
}

export const MousePointers: React.FunctionComponent<IMousePointersViewProps> =
	({clientIds}) =>
		<div className="pointers">
			{clientIds
				.map(clientId =>
					<ConnectedMousePointer
						key={clientId}
						clientId={clientId}
					/>,
				)
			}
		</div>

const mapStateToProps = (state: IClientAppState): IMousePointersViewProps => {
	return {
		clientIds: selectAllOtherRoomMemberIds(state),
	}
}

export const ConnectedMousePointers = connect(mapStateToProps)(MousePointers)
