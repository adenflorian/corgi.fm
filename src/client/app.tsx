import {ConnectedKeyboard} from './Keyboard.js';

export const App = ({otherClients}) => (
    <React.Fragment>
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
                    <div>
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
    </React.Fragment>
)

App.propTypes = {
    otherClients: PropTypes.array
}

App.defaultProps = {
    otherClients: []
}

const mapStateToProps = (state) => ({
    otherClients: state.otherClients
})

export const ConnectedApp = ReactRedux.connect(mapStateToProps)(App)
