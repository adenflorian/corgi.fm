import {Fragment} from 'react'
import * as React from 'react'
import {connect} from 'react-redux'
import {selectAllBasicInstrumentIds} from '../common/redux/basic-instruments-redux'
import {selectLocalClient} from '../common/redux/clients-redux'
import {IClientAppState} from '../common/redux/common-redux-types'
import {
	ConnectionNodeType, IConnection, selectSortedConnections,
} from '../common/redux/connections-redux'
import {selectAllGridSequencerIds} from '../common/redux/grid-sequencers-redux'
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
import {ConnectedMousePointers} from './MousePointers/MousePointers'
import {ConnectedTopDiv} from './TopDiv'
import {ConnectedVolumeControl} from './Volume/VolumeControl'

interface IOnlineAppProps {
	connections: IConnection[]
	instrumentIds: string[]
	keyboardIds: string[]
	hasLocalClient: boolean
	gridSequencerIds: string[]
}

export const mainBoardsId = 'mainBoards'

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
									if (connection.targetType === ConnectionNodeType.audioOutput) return

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
	keyboardIds: selectAllVirtualKeyboardIds(state.room),
	instrumentIds: selectAllBasicInstrumentIds(state.room),
	gridSequencerIds: selectAllGridSequencerIds(state.room),
	connections: selectSortedConnections(state.room),
})

export const ConnectedOnlineApp = connect(mapStateToProps)(OnlineApp)
