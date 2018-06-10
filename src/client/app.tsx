import classnames from 'classnames'
import * as React from 'react'
import {Fragment} from 'react'
import {connect} from 'react-redux'
import './App.css'
import './css-reset.css'
import {ConnectedKeyboard} from './Keyboard'
import {DummyClient, IClient} from './redux/clients-redux'
import {IAppState} from './redux/configureStore'

interface IAppProps {
	myClient: IClient
	clients: any[]
	info: string
}

const ClientId = ({client: {id, color}}) => {
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
				<h1 id="title">sha-mu</h1>

				<div className="boardContainer">
					<div id="you" className="board connected">
						{/* {otherClients.length > 0 &&
							<h2>you:</h2>
						} */}
						<ClientId client={myClient} />
						<ConnectedKeyboard ownerId={myClient.id} />
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
								<ClientId client={client} />
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
