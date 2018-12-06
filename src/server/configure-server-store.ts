import {combineReducers, createStore} from 'redux'
import {roomsReducer} from '../common/redux/rooms-redux'
import {getInitialServerState} from './initial-server-redux-state'

export function configureServerStore() {
	return createStore(
		combineReducers({
			rooms: roomsReducer,
		}),
		getInitialServerState(),
	)
}
