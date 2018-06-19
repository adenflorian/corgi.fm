import classnames from 'classnames'
import * as React from 'react'
import {Fragment} from 'react'
import {connect} from 'react-redux'
import {DummyClient, IClient} from '../common/redux/clients-redux'
import {IAppState} from '../common/redux/configureStore'
import {AppOptions} from '../common/redux/options-redux'
import './App.less'
import './css-reset.css'
import {ConnectedKeyboard} from './Keyboard/Keyboard'
import {ConnectedOption} from './Option'
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

				{/* <ConnectedDAW /> */}

				<div className="boardContainer">
					<div className="board connected" style={{marginBottom: 'auto'}}>
						<ConnectedOption
							option={AppOptions.showNoteNamesOnKeyboard}
							label="show names on keyboard"
						/>
					</div>
					<div className="board connected">
						<ConnectedSimpleTrack />
					</div>
					<div className="board connected">
						<ConnectedVolumeControl />
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
