import {combineReducers, createStore} from 'redux'
import {simpleTrackReducer} from '../common/redux/simple-track-redux'
import {getInitialServerState} from './server-initial-state'

export function configureServerStore() {
	return createStore(
		combineReducers({
			simpleTrack: simpleTrackReducer,
		}),
		getInitialServerState(),
	)
}
