import PropTypes from 'prop-types'
import * as React from 'react'
import {Fragment} from 'react'
import {connect} from 'react-redux'
import {ConnectedKeyboard} from './Keyboard'

interface IAppProps {
	otherClients: any[]
}

class App extends React.Component<IAppProps, {}> {
	public static defaultProps = {
		otherClients: [],
	}

	public render() {
		const {otherClients} = this.props

		return (
			<Fragment>
				<h2>sha-mu</h2>
				<div id="info" />

				<br />

				<h2>you:</h2>

				<div>
					<div id="clientId">
					</div>
					<div id="frequency">
						000.00 Hz
					</div>
					<ConnectedKeyboard />
				</div>

				<br />

				<h2>other clients:</h2>

				<div id="otherClients">
				</div>

				<div id="otherClients2">
					{otherClients.map(client => {
						return (
							<div key={client.id}>
								{client.id}
								<ConnectedKeyboard />
							</div>
						)
					})}
					{/* {clients.forEach(client => {
                if (client.id === myClientId) return
                const newClientDiv = document.createElement('div')
                newClientDiv.textContent = client.id
                newClientDiv.textContent += ` ${(clientNoteMap[client.id] && clientNoteMap[client.id].frequency) || 0}`
                clientsDiv.appendChild(newClientDiv)
            })} */}
				</div>
			</Fragment>
		)
	}
}

const mapStateToProps = state => ({
	otherClients: state.otherClients,
})

export const ConnectedApp = connect(mapStateToProps)(App)
