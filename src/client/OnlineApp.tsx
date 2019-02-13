import {List} from 'immutable'
import {Fragment} from 'react'
import * as React from 'react'
import {connect} from 'react-redux'
import {ConnectionNodeType} from '../common/common-types'
import {IClientAppState} from '../common/redux'
import {
	IConnection, selectSortedConnections,
} from '../common/redux'
import {CssColor, getColorHslByHex} from '../common/shamu-color'
import {ConnectedChat} from './Chat'
import {mainBoardsId} from './client-constants'
import {ConnectedConnections, ConnectionsUsage} from './Connections/Connections'
import {ConnectedMasterControls} from './MasterControls'
import {ConnectedMousePointers} from './MousePointers/MousePointers'
import {ConnectedSimpleGraph} from './SimpleGraph/SimpleGraph'
import {getComponentByNodeType} from './SimpleGraph/SimpleGraphNode'
import {ConnectedTopDiv} from './TopDiv'
import {ConnectedVolumeControl} from './Volume/VolumeControl'

interface IOnlineAppProps {
	connections: List<IConnection>
}

class OnlineApp extends React.PureComponent<IOnlineAppProps> {
	public render() {
		return (
			<Fragment>
				<ConnectedMousePointers />
				<ConnectedChat />
				<ConnectedTopDiv />

				{window.location.pathname !== '/old'
					? <ConnectedSimpleGraph />
					: <Fragment>
						<div id={mainBoardsId} className="boards">
							<ConnectedConnections usage={ConnectionsUsage.normal} />
							<div className="boardRow">
								<div className="board connected">
									<ConnectedMasterControls />
								</div>
								<div className="board connected">
									<ConnectedVolumeControl color={getColorHslByHex(CssColor.blue)} />
								</div>
							</div>
							{this.props.connections
								.map(connection => {
									if ([ConnectionNodeType.audioOutput, ConnectionNodeType.masterClock].includes(connection.targetType)) return
									if ([ConnectionNodeType.audioOutput, ConnectionNodeType.masterClock].includes(connection.sourceType)) return

									return (
										<div className="boardRow" key={connection.id}>
											<div
												key={connection.sourceId}
												className="board connected"
											>
												{getComponentByNodeType(connection.sourceType, connection.sourceId)}
											</div>
											<div
												key={connection.targetId}
												className="board connected"
											>
												{getComponentByNodeType(connection.targetType, connection.targetId)}
											</div>
										</div>
									)
								})
							}
						</div>

						<div id="info" />
					</Fragment>
				}
			</Fragment>
		)
	}
}

const mapStateToProps = (state: IClientAppState): IOnlineAppProps => ({
	connections: selectSortedConnections(state.room),
})

export const ConnectedOnlineApp = connect(mapStateToProps)(OnlineApp)
