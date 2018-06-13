import classnames from 'classnames'
import hashbow from 'hashbow'
import * as React from 'react'
import {Fragment} from 'react'
import {connect} from 'react-redux'
import './App.css'
import './css-reset.css'
import {ConnectedDAW} from './DAW/DAW'
import {ConnectedKeyboard} from './Keyboard/Keyboard'
import {DummyClient, IClient} from './redux/clients-redux'
import {IAppState} from './redux/configureStore'
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

				{/* <ConnectedDAW /> */}

				<div className="boardContainer">
					<div id="you" className="board connected">
						{/* {otherClients.length > 0 &&
							<h2>you:</h2>
						} */}
						{otherClients.length > 0 &&
							<ClientId id={myClient.id} color={myClient.color} />
						}
						<ConnectedKeyboard ownerId={myClient.id} myKeyboard={true} />
					</div>
					<div id="track-1" className="board connected">
						{/* {otherClients.length > 0 &&
							<h2>you:</h2>
						} */}
						{/* {otherClients.length > 0 && */}
						<ClientId id={'track-1'} color={hashbow('track-1')} />
						{/* } */}
						<ConnectedKeyboard ownerId={'track-1'} />
					</div>

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
