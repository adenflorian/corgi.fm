import {List} from 'immutable'
import * as React from 'react'
import {connect} from 'react-redux'
import {IClientAppState} from '../../common/redux'
import {selectAllOtherRoomMemberIds} from '../../common/redux'
import {ConnectedMousePointer} from './MousePointer'

interface IMousePointersViewProps {
	clientIds: List<string>
}

export const MousePointers: React.FC<IMousePointersViewProps> =
	React.memo(function _MousePointers({clientIds}) {
		return (
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
		)
	})

const mapStateToProps = (state: IClientAppState): IMousePointersViewProps => {
	return {
		clientIds: selectAllOtherRoomMemberIds(state),
	}
}

export const ConnectedMousePointers = connect(mapStateToProps)(MousePointers)
