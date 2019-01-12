import * as React from 'react'
import {connect} from 'react-redux'
import {selectAllOtherClientIds} from '../../common/redux/clients-redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {ConnectedMousePointer} from './MousePointer'

interface IMousePointersViewProps {
	clientIds: string[]
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
		clientIds: selectAllOtherClientIds(state),
	}
}

export const ConnectedMousePointers = connect(mapStateToProps)(MousePointers)
