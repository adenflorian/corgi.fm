import {Keyboard} from './Keyboard.js';

export const App = () => (
    <React.Fragment>
        <h2>sha-mu</h2>
        <div id="info" />

        <br />

        <h2>you:</h2>

        <div>
            <span id="clientId">
            </span>
            <span id="frequency">
                0
            </span>
            <Keyboard />
        </div>

        <br />

        <h2>other clients:</h2>

        <div id="otherClients">
        </div>
    </React.Fragment>
)
