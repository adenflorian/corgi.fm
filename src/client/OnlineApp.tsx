import {Fragment} from 'react'
import * as React from 'react'
import {connect} from 'react-redux'
import {selectLocalClient} from '../common/redux/clients-redux'
import {IClientAppState} from '../common/redux/common-redux-types'
import {
	ConnectionNodeType, IConnection, selectSortedConnections,
} from '../common/redux/connections-redux'
import {CssColor, getColorHslByHex} from '../common/shamu-color'
import {ConnectedBasicSampler} from './BasicSampler/BasicSampler'
import {ConnectedChat} from './Chat'
import {ConnectionsContainer} from './Connections/Connections'
import {ConnectedGridSequencerContainer} from './GridSequencer/GridSequencerContainer'
import {ConnectedInfiniteSequencer} from './InfiniteSequencer/InfiniteSequencer'
import {ConnectedBasicInstrumentView} from './Instruments/BasicInstrumentView'
import {ConnectedKeyboard} from './Keyboard/Keyboard'
import {ConnectedMasterControls} from './MasterControls'
import {ConnectedMousePointers} from './MousePointers/MousePointers'
import {ConnectedSimpleGraph} from './SimpleGraph/SimpleGraph'
import {ConnectedTopDiv} from './TopDiv'
import {ConnectedVolumeControl} from './Volume/VolumeControl'

interface IOnlineAppProps {
	connections: IConnection[]
	hasLocalClient: boolean
}

export const mainBoardsId = 'mainBoards'

// TODO Make Pure
class OnlineApp extends React.Component<IOnlineAppProps> {
	public render() {
		const {hasLocalClient} = this.props

		return (
			<Fragment>
				{hasLocalClient &&
					<Fragment>
						<ConnectedMousePointers />
						<ConnectedChat />
						<ConnectedTopDiv />

						<div id={mainBoardsId} className="boards">
							<ConnectionsContainer />
							{window.location.pathname === '/graph'
								? <ConnectedSimpleGraph />
								: <Fragment>
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
														{
															connection.sourceType === ConnectionNodeType.gridSequencer
																? <ConnectedGridSequencerContainer id={connection.sourceId} />
																: connection.sourceType === ConnectionNodeType.infiniteSequencer
																	? <ConnectedInfiniteSequencer id={connection.sourceId} />
																	: connection.sourceType === ConnectionNodeType.keyboard
																		? <ConnectedKeyboard id={connection.sourceId} />
																		: new Error('ugh')
														}
													</div>
													{connection.targetType === ConnectionNodeType.instrument &&
														<div
															key={connection.targetId}
															className="board connected"
														>
															<ConnectedBasicInstrumentView id={connection.targetId} />
														</div>
													}
													{connection.targetType === ConnectionNodeType.sampler &&
														<div
															key={connection.targetId}
															className="board connected"
														>
															<ConnectedBasicSampler id={connection.targetId} />
														</div>
													}
												</div>
											)
										})
									}
								</Fragment>
							}
						</div>
					</Fragment>
				}

				<div id="info" />
			</Fragment>
		)
	}
}

const mapStateToProps = (state: IClientAppState): IOnlineAppProps => ({
	hasLocalClient: selectLocalClient(state) !== undefined,
	connections: selectSortedConnections(state.room),
})

export const ConnectedOnlineApp = connect(mapStateToProps)(OnlineApp)
