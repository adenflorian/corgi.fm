import {Fragment} from 'react'
import * as React from 'react'
import {connect} from 'react-redux'
import {selectAllBasicInstrumentIds} from '../common/redux/basic-instruments-redux'
import {IClientState, selectLocalClient} from '../common/redux/clients-redux'
import {IClientAppState} from '../common/redux/common-redux-types'
import {
	ConnectionSourceType, ConnectionTargetType, IConnection, selectSortedConnections,
} from '../common/redux/connections-redux'
import {selectAllGridSequencers} from '../common/redux/grid-sequencers-redux'
import {selectAllVirtualKeyboardIds} from '../common/redux/virtual-keyboard-redux'
import {CssColor, getColorHslByHex} from '../common/shamu-color'
import {ConnectedBasicSampler} from './BasicSampler/BasicSampler'
import {ConnectedChat} from './Chat'
import {ConnectionsContainer} from './Connections/Connections'
import {ConnectedGridSequencerContainer} from './GridSequencer/GridSequencerContainer'
import {ConnectedInfiniteSequencer} from './InfiniteSequencer/InfiniteSequencer'
import {ConnectedBasicInstrumentView} from './Instruments/BasicInstrumentView'
import {ConnectedKeyboard} from './Keyboard/Keyboard'
import {ConnectedMasterControls} from './MasterControls'
import {MousePointers} from './MousePointers'
import {ConnectedTopDiv} from './TopDiv'
import {ConnectedVolumeControl} from './Volume/VolumeControl'

interface IOnlineAppProps {
	connections: IConnection[]
	instrumentIds: string[]
	keyboardIds: string[]
	myClient: IClientState
	gridSequencerIds: string[]
}

export const mainBoardsId = 'mainBoards'

class OnlineApp extends React.Component<IOnlineAppProps> {
	public render() {
		const {myClient} = this.props

		return (
			<Fragment>
				{myClient &&
					<Fragment>
						<MousePointers />
						<ConnectionsContainer />
						<ConnectedChat />
						<ConnectedTopDiv />

						<div id={mainBoardsId} className="boards">
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

				<div id="info" />
			</Fragment>
		)
	}
}

const mapStateToProps = (state: IClientAppState): IOnlineAppProps => ({
	myClient: selectLocalClient(state),
	keyboardIds: selectAllVirtualKeyboardIds(state.room),
	instrumentIds: selectAllBasicInstrumentIds(state.room),
	gridSequencerIds: Object.keys(selectAllGridSequencers(state.room)),
	connections: selectSortedConnections(state.room),
})

export const ConnectedOnlineApp = connect(mapStateToProps)(OnlineApp)
