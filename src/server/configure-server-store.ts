import {combineReducers, createStore} from 'redux'
import {basicInstrumentsReducer} from '../common/redux/basic-instruments-redux'
import {simpleTrackReducer} from '../common/redux/simple-track-redux'
import {getInitialServerState} from './initial-server-redux-state'

export function configureServerStore() {
	return createStore(
		combineReducers({
			basicInstruments: basicInstrumentsReducer,
			simpleTrack: simpleTrackReducer,
		}),
		getInitialServerState(),
	)
}
