import Color from 'color'
import {Fragment} from 'react'
import * as React from 'react'
import {hot} from 'react-hot-loader'
import {connect} from 'react-redux'
import {selectAllInstrumentIds} from '../common/redux/basic-instruments-redux'
import {IClientState, selectAllClients, selectLocalClient} from '../common/redux/clients-redux'
import {IAppState} from '../common/redux/configureStore'
import {IConnection, selectAllConnectionsAsArray} from '../common/redux/connections-redux'
import {AppOptions} from '../common/redux/options-redux'
import {selectAllTrackIds} from '../common/redux/tracks-redux'
import {selectAllVirtualKeyboardIds} from '../common/redux/virtual-keyboard-redux'
import './App.less'
import {Chat} from './Chat'
import {ConnectionsContainer} from './Connections/Connections'
import './css-reset.css'
import {ConnectedBasicInstrumentView} from './Instruments/BasicInstrumentView'
import {ConnectedKeyboard} from './Keyboard/Keyboard'
import {MousePointers} from './MousePointers'
import {ConnectedOption} from './Option'
import {ConnectedRoomSelector} from './RoomSelector'
import {ConnectedTrackContainer} from './Track/TrackContainer'
import {ConnectedVolumeControl} from './Volume/VolumeControl'

interface IAppProps {
	myClient: IClientState
	clients: any[]
	connections: IConnection[]
	info: string
	instrumentIds: string[]
	keyboardIds: string[]
	trackIds: string[]
}

const TRACK_1_BASE_COLOR = '#4077bf'
const TRACK_1_COLOR = Color(TRACK_1_BASE_COLOR).desaturate(0.4).hsl().string()

class App extends React.Component<IAppProps, {}> {
	public static defaultProps = {
		clients: [],
	}

	public render() {
		const {info, myClient} = this.props

		return (
			<Fragment>
				{myClient &&
					<Fragment>
						<MousePointers />
						<ConnectionsContainer />
						<Chat />

						<div style={{marginBottom: 'auto'}}>
							<ConnectedOption
								option={AppOptions.showNoteNamesOnKeyboard}
								label="show names on keyboard"
							/>
							<div id="fps"></div>
							<ConnectedRoomSelector />
						</div>

						<div id="mainBoards" className="boards">
							<div className="boardRow">
								<div className="board connected">
									<ConnectedVolumeControl color={TRACK_1_COLOR} />
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
													connection.sourceType === 'track'
														? <ConnectedTrackContainer id={connection.sourceId} />
														: <ConnectedKeyboard id={connection.sourceId} />
												}
											</div>
											<div
												key={connection.targetId}
												className="board connected"
											>
												<ConnectedBasicInstrumentView id={connection.targetId} />
											</div>
										</div>
									)
								})
							}
						</div>
					</Fragment>
				}

				<div
					id="info"
					style={{marginTop: 'auto'}}
				>
					{info}
				</div>
			</Fragment>
		)
	}
}

function sortConnection(connA: IConnection, connB: IConnection) {
	if (connA.sourceType !== connB.sourceType) {
		return connA.sourceType === 'track' ? -1 : 1
	}
}

const mapStateToProps = (state: IAppState) => ({
	clients: selectAllClients(state),
	myClient: selectLocalClient(state),
	info: state.websocket.info,
	keyboardIds: selectAllVirtualKeyboardIds(state),
	instrumentIds: selectAllInstrumentIds(state),
	trackIds: selectAllTrackIds(state),
	connections: selectAllConnectionsAsArray(state),
})

export const ConnectedApp = hot(module)(connect(mapStateToProps)(App))
