import classnames from 'classnames'
import * as React from 'react'
import {Fragment} from 'react'
import {connect} from 'react-redux'
import './App.css'
import './css-reset.css'
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

		const otherClients = clients.filter(x => x.id !== myClientId)

		return (
			<Fragment>
				<h1 id="title">sha-mu</h1>

				<div className="boardContainer">
					<div id="you" className="board connected">
						{/* {otherClients.length > 0 &&
							<h2>you:</h2>
						} */}
						<ClientId id={myClientId} />
						<ConnectedKeyboard ownerId={myClientId} />
					</div>

					{/* <div id="otherClients" className="board"> */}
					{/* {otherClients.length > 0 &&
							<h2>others:</h2>
						} */}

					{otherClients.map(client => {
						return (
							<div
								id="otherClients"
								key={client.id}
								className={classnames('board', client.disconnecting ? 'disconnecting' : 'connected')}
							>
								<div>
									<ClientId id={client.id} />
									<ConnectedKeyboard ownerId={client.id} />
								</div>
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
	myClientId: state.websocket.myClientId,
	clients: state.clients,
	info: state.websocket.info,
})

export const ConnectedApp = connect(mapStateToProps)(App)
