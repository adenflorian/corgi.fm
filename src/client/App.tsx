import Color from 'color'
import * as React from 'react'
import {Fragment} from 'react'
import {connect} from 'react-redux'
import {selectAllInstrumentIds} from '../common/redux/basic-instruments-redux'
import {IClientState, selectAllClients, selectLocalClient} from '../common/redux/clients-redux'
import {IAppState} from '../common/redux/configureStore'
import {AppOptions} from '../common/redux/options-redux'
import {selectAllTrackIds} from '../common/redux/tracks-redux'
import {selectAllVirtualKeyboardIds} from '../common/redux/virtual-keyboard-redux'
import './App.less'
import {ConnectionsContainer} from './Connections/Connections'
import './css-reset.css'
import {ConnectedBasicInstrumentView} from './Instruments/BasicInstrumentView'
import {ConnectedKeyboard} from './Keyboard/Keyboard'
import {MousePointers} from './MousePointers'
import {ConnectedOption} from './Option'
import {ConnectedTrackContainer} from './Track/TrackContainer'
import {ConnectedVolumeControl} from './Volume/VolumeControl'

interface IAppProps {
	myClient: IClientState
	clients: any[]
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
		const {info, myClient, clients} = this.props

		if (!myClient) return null

		return (
			<Fragment>
				<MousePointers />
				<ConnectionsContainer />

				<div className="boardContainer">
					<div className="board connected" style={{marginBottom: 'auto'}}>
						<ConnectedOption
							option={AppOptions.showNoteNamesOnKeyboard}
							label="show names on keyboard"
						/>
					</div>
					<div className="board connected">
						<ConnectedVolumeControl color={TRACK_1_COLOR} />
					</div>

					{this.props.trackIds
						.sort()
						.map(trackId => {
							return (
								<div
									key={trackId}
									className="board connected"
								>
									<ConnectedTrackContainer id={trackId} />
								</div>
							)
						})}

					{this.props.keyboardIds
						.sort()
						.map(keyboardId => {
							return (
								<div
									key={keyboardId}
									className="board connected"
								>
									<ConnectedKeyboard id={keyboardId} />
								</div>
							)
						})}

					{this.props.instrumentIds
						.sort()
						.map(instrumentId => {
							return (
								<div
									key={instrumentId}
									className="board"
								>
									<ConnectedBasicInstrumentView id={instrumentId} />
								</div>
							)
						})}

					<div
						id="info"
						style={{marginTop: 'auto'}}
					>
						{clients.length > 0 && info}
					</div>
				</div>
			</Fragment>
		)
	}
}

const mapStateToProps = (state: IAppState) => ({
	clients: selectAllClients(state),
	myClient: selectLocalClient(state),
	info: state.websocket.info,
	keyboardIds: selectAllVirtualKeyboardIds(state),
	instrumentIds: selectAllInstrumentIds(state),
	trackIds: selectAllTrackIds(state),
})

export const ConnectedApp = connect(mapStateToProps)(App)
