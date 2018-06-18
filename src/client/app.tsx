import classnames from 'classnames'
import {Fragment} from 'react'
import * as React from 'react'
import {connect} from 'react-redux'
import './App.less'
import './css-reset.css'
import {ConnectedKeyboard} from './Keyboard/Keyboard'
import {ConnectedOption} from './Option'
import {DummyClient, IClient} from './redux/clients-redux'
import {IAppState} from './redux/configureStore'
import {AppOptions} from './redux/options-redux'
import {ConnectedSimpleTrack} from './SimpleTrack'
import {hashbow} from './utils'
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

				<ConnectedVolumeControl />

				<ConnectedOption
					option={AppOptions.showNoteNamesOnKeyboard}
					label="show names on keyboard"
				/>

				{/* <ConnectedDAW /> */}

				<div className="boardContainer">
					<div className="board connected">
						<ConnectedSimpleTrack />
					</div>
					<div id="track-1" className="board connected">
						<ClientId id={'track-1'} color={hashbow('track-1')} />
						<ConnectedKeyboard ownerId={'track-1'} />
					</div>
					<div id="you" className="board connected">
						{/* {otherClients.length > 0 &&
							<h2>you:</h2>
						} */}
						<ClientId id={myClient.id} color={myClient.color} />
						<ConnectedKeyboard ownerId={myClient.id} myKeyboard={true} />
					</div>
					{/* {isProd() === false &&
						<div className="board">
							<BasicInstrumentView />
						</div>
					} */}

					{/* <div id="otherClients" className="board"> */}
					{/* {otherClients.length > 0 &&
							<h2>others:</h2>
						} */}

					{otherClients.map(client => {
						return (
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
						)
					})
					}
					{/* </div> */}
				</div>

				{otherClients.length > 0 &&
					<div id="info">{info}</div>
				}
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
