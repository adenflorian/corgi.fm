import classnames from 'classnames'
import {Fragment} from 'react'
import * as React from 'react'
import {connect} from 'react-redux'
import {DummyClient, IClient} from '../common/redux/clients-redux'
import {IAppState} from '../common/redux/configureStore'
import {AppOptions} from '../common/redux/options-redux'
import './App.less'
import './css-reset.css'
import {ConnectedBasicInstrumentView} from './Instruments/BasicInstrumentView'
import {ConnectedKeyboard} from './Keyboard/Keyboard'
import {ConnectedOption} from './Option'
import {ConnectedSimpleTrack} from './SimpleTrack'
import {ConnectedVolumeControl} from './Volume/VolumeControl'

interface IAppProps {
	myClient: IClient
	clients: any[]
	info: string
}

const ClientId = ({id, color}) => {
	return (
		<div className="clientId" style={{color}}>
			{id || '""'}
		</div>
	)
}

const TRACK_1 = 'track-1'
const TRACK_1_COLOR = '#40bf42'

class App extends React.Component<IAppProps, {}> {
	public static defaultProps = {
		clients: [],
		myClient: new DummyClient(),
	}

	public render() {
		const {info, myClient, clients} = this.props

		const otherClients = clients.filter(x => x.id !== myClient.id)

		return (
			<Fragment>
				{/* <h1 id="title">sha-mu</h1> */}

				<div className="boardContainer">
					<div className="board connected" style={{marginBottom: 'auto'}}>
						<ConnectedOption
							option={AppOptions.showNoteNamesOnKeyboard}
							label="show names on keyboard"
						/>
					</div>
					<div className="board connected">
						<ConnectedVolumeControl />
					</div>
					<div className="board connected">
						<ConnectedSimpleTrack />
					</div>
					<div id="track-1" className="board connected">
						<ClientId id={TRACK_1} color={TRACK_1_COLOR} />
						<ConnectedKeyboard ownerId={TRACK_1} color={TRACK_1_COLOR} />
					</div>
					<div className="board">
						<ConnectedBasicInstrumentView ownerId={TRACK_1} color={TRACK_1_COLOR} pan={0} />
					</div>
					<div id="you" className="board connected">
						<ClientId id={myClient.id} color={myClient.color} />
						<ConnectedKeyboard ownerId={myClient.id} myKeyboard={true} />
					</div>
					<div className="board">
						<ConnectedBasicInstrumentView ownerId={myClient.id} color={myClient.color} pan={-0.5} />
					</div>

					{otherClients.map(client => {
						return (
							<Fragment>
								<div
									key={client.id}
									className={classnames(
										'otherClient',
										'board',
										client.disconnecting ? 'disconnecting' : 'connected',
									)}
								>
									<ClientId id={client.id} color={client.color} />
									<ConnectedKeyboard ownerId={client.id} />
								</div>
								<div className="board">
									<ConnectedBasicInstrumentView ownerId={client.id} color={client.color} pan={0.5} />
								</div>
							</Fragment>
						)
					})}

					<div
						id="info"
						style={{marginTop: 'auto'}}
					>
						{otherClients.length > 0 && info}
					</div>
				</div>
			</Fragment>
		)
	}
}

const mapStateToProps = (state: IAppState) => ({
	clients: state.clients,
	myClient: state.clients.find(x => x.id === state.websocket.myClientId),
	info: state.websocket.info,
})

export const ConnectedApp = connect(mapStateToProps)(App)
