import {combineReducers, createStore} from 'redux'
import {getInitialServerState} from '../../server/initial-server-redux-state'
import {basicInstrumentsReducer} from './basic-instruments-redux'
import {clientsReducer} from './clients-redux'
import {connectionsReducer} from './connections-redux'
import {tracksReducer} from './tracks-redux'
import {virtualKeyboardsReducer} from './virtual-keyboard-redux'

export function configureRoomStore() {
	return createStore(
		combineReducers({
			basicInstruments: basicInstrumentsReducer,
			clients: clientsReducer,
			connections: connectionsReducer,
			tracks: tracksReducer,
			virtualKeyboards: virtualKeyboardsReducer,
		}),
		getInitialServerState(),
	)
}
