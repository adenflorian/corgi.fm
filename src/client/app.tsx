import * as React from 'react'
import {Fragment} from 'react'
import {connect} from 'react-redux'
import {ConnectedKeyboard} from './Keyboard'
import {IAppState} from './redux/configureStore'

interface IAppProps {
	myClientId: string
	otherClients: any[]
	info: string
}

class App extends React.Component<IAppProps, {}> {
	public static defaultProps = {
		otherClients: [],
	}

	public render() {
		const {info, myClientId, otherClients} = this.props

		return (
			<Fragment>
				<h2>sha-mu</h2>

				<div>{info}</div>

				<h2>you:</h2>

				<div>
					<div>
						{myClientId}
					</div>
					<ConnectedKeyboard ownerId={myClientId} />
				</div>

				<h2>others:</h2>

				<div id="otherClients">
					{otherClients.filter(x => x.id !== myClientId)
						.map(client => {
							return (
								<div key={client.id}>
									<div>
										{client.id}
									</div>
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
	otherClients: state.otherClients,
	info: state.websocket.info,
})

export const ConnectedApp = connect(mapStateToProps)(App)
