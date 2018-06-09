import * as React from 'react'
import {Fragment} from 'react'
import {connect} from 'react-redux'
import './App.css'
import {ConnectedKeyboard} from './Keyboard'
import {IAppState} from './redux/configureStore'

interface IAppProps {
	myClientId: string
	clients: any[]
	info: string
}

const ClientId = ({id}) => {
	return (
		<div className="clientId">
			{id || '""'}
		</div>
	)
}

class App extends React.Component<IAppProps, {}> {
	public static defaultProps = {
		clients: [],
	}

	public render() {
		const {info, myClientId, clients} = this.props

		return (
			<Fragment>
				<h1 id="title">sha-mu</h1>

				<div id="info">{info}</div>

				<div id="you">
					<h2>you:</h2>
					<ClientId id={myClientId} />
					<ConnectedKeyboard ownerId={myClientId} />
				</div>

				<div id="otherClients">
					<h2>others:</h2>

					{clients.filter(x => x.id !== myClientId)
						.map(client => {
							return (
								<div key={client.id}>
									<ClientId id={client.id} />
									<ConnectedKeyboard ownerId={client.id} />
								</div>
							)
						})
					}
				</div>
			</Fragment>
		)
	}
}

const mapStateToProps = (state: IAppState) => ({
	myClientId: state.websocket.myClientId,
	clients: state.clients,
	info: state.websocket.info,
})

export const ConnectedApp = connect(mapStateToProps)(App)
