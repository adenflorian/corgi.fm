import {Fragment} from 'react'
import * as React from 'react'
import {connect} from 'react-redux'
import {selectAllBasicInstrumentIds} from '../common/redux/basic-instruments-redux'
import {IClientState, selectClientCount, selectLocalClient} from '../common/redux/clients-redux'
import {IClientAppState} from '../common/redux/common-redux-types'
import {
	ConnectionSourceType, ConnectionTargetType, IConnection, selectAllConnectionsAsArray,
} from '../common/redux/connections-redux'
import {selectAllGridSequencers} from '../common/redux/grid-sequencers-redux'
import {selectMemberCount} from '../common/redux/room-members-redux'
import {selectAllVirtualKeyboardIds} from '../common/redux/virtual-keyboard-redux'
import {getColorHslByHex} from '../common/shamu-color'
import {ConnectedBasicSampler} from './BasicSampler/BasicSampler'
import {Button} from './Button/Button'
import {ConnectedChat} from './Chat'
import {ConnectionsContainer} from './Connections/Connections'
import {ConnectedGridSequencerContainer} from './GridSequencer/GridSequencerContainer'
import {ConnectedInfiniteSequencer} from './InfiniteSequencer/InfiniteSequencer'
import {ConnectedBasicInstrumentView} from './Instruments/BasicInstrumentView'
import {ConnectedKeyboard} from './Keyboard/Keyboard'
import {ConnectedMasterControls} from './MasterControls'
import {MousePointers} from './MousePointers'
import {Options} from './Options/Options'
import {ConnectedRoomSelector} from './RoomSelector'
import {ConnectedVolumeControl} from './Volume/VolumeControl'

interface IOnlineAppProps {
	clientCount: number
	connections: IConnection[]
	info: string
	instrumentIds: string[]
	keyboardIds: string[]
	memberCount: number
	myClient: IClientState
	gridSequencerIds: string[]
}

const GRID_SEQUENCER_1_BASE_COLOR = '#4077bf'
const MASTER_VOLUME_COLOR = getColorHslByHex(GRID_SEQUENCER_1_BASE_COLOR)

export const mainBoardsId = 'mainBoards'

class OnlineApp extends React.Component<IOnlineAppProps> {
	public render() {
		const {clientCount, info, memberCount, myClient} = this.props

		return (
			<Fragment>
				{myClient &&
					<Fragment>
						<MousePointers />
						<ConnectionsContainer />
						<ConnectedChat />

						<div id="topDiv" style={{marginBottom: 'auto'}}>
							<div className="left">
								<div>{info}</div>
								<div id="fps">FPS</div>
								<Options />
							</div>
							<div className="right">
								<Button
									buttonProps={{onClick: () => window.location.pathname = '/newsletter'}}
									buttonChildren="Newsletter Signup"
								/>
								<ConnectedRoomSelector />
								<div style={{margin: 8}}>{memberCount} room member{memberCount > 1 ? 's' : ''}</div>
								<div style={{margin: 8}}>{clientCount} total user{clientCount > 1 ? 's' : ''}</div>
							</div>
						</div>

						<div id={mainBoardsId} className="boards">
							<div className="boardRow">
								<div className="board connected">
									<ConnectedMasterControls />
								</div>
								<div className="board connected">
									<ConnectedVolumeControl color={MASTER_VOLUME_COLOR} />
								</div>
							</div>
							{this.props.connections
								.sort(sortConnection)
								.map(connection => {
									return (
										<div className="boardRow" key={connection.id}>
											<div
												key={connection.sourceId}
												className="board connected"
											>
												{
													connection.sourceType === ConnectionSourceType.gridSequencer
														? <ConnectedGridSequencerContainer id={connection.sourceId} />
														: connection.sourceType === ConnectionSourceType.infiniteSequencer
															? <ConnectedInfiniteSequencer id={connection.sourceId} />
															: <ConnectedKeyboard id={connection.sourceId} />
												}
											</div>
											{connection.targetType === ConnectionTargetType.instrument &&
												<div
													key={connection.targetId}
													className="board connected"
												>
													<ConnectedBasicInstrumentView id={connection.targetId} />
												</div>
											}
											{connection.targetType === ConnectionTargetType.sampler &&
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
						</div>
					</Fragment>
				}

				<div
					id="info"
				>
				</div>
			</Fragment>
		)
	}
}

function sortConnection(connA: IConnection, connB: IConnection) {
	if (connA.sourceType !== connB.sourceType) {
		return connA.sourceType === 'gridSequencer'
			? -1
			: connA.sourceType === 'infiniteSequencer'
				? -1
				: 1
	} else {
		return connA.id > connB.id ? -1 : 1
	}
}

const mapStateToProps = (state: IClientAppState): IOnlineAppProps => ({
	clientCount: selectClientCount(state),
	myClient: selectLocalClient(state),
	info: state.websocket.info,
	keyboardIds: selectAllVirtualKeyboardIds(state.room),
	instrumentIds: selectAllBasicInstrumentIds(state.room),
	gridSequencerIds: Object.keys(selectAllGridSequencers(state.room)),
	connections: selectAllConnectionsAsArray(state.room),
	memberCount: selectMemberCount(state.room),
})

export const ConnectedOnlineApp = connect(mapStateToProps)(OnlineApp)
