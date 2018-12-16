import {Dispatch, Middleware} from 'redux'
import {deleteAllTheThings} from '../../client/websocket-listeners'
import {addBasicInstrument, BasicInstrumentState} from './basic-instruments-redux'
import {IClientAppState} from './client-store'
import {ADD_CLIENT, selectLocalClient} from './clients-redux'
import {addConnection, Connection, ConnectionSourceType, ConnectionTargetType} from './connections-redux'
import {makeActionCreator} from './redux-utils'
import {selectActiveRoom, SET_ACTIVE_ROOM} from './rooms-redux'
import {
	addVirtualKeyboard, selectLocalKeyboardId, VirtualKeyboardState, virtualKeyPressed, virtualKeyUp, virtualOctaveChange,
} from './virtual-keyboard-redux'
import {selectLocalSocketId} from './websocket-redux'

export const LOCAL_MIDI_KEY_PRESS = 'LOCAL_MIDI_KEY_PRESS'
export const localMidiKeyPress = makeActionCreator(LOCAL_MIDI_KEY_PRESS, 'midiNote')

export const LOCAL_MIDI_KEY_UP = 'LOCAL_MIDI_KEY_UP'
export const localMidiKeyUp = makeActionCreator(LOCAL_MIDI_KEY_UP, 'midiNote')

export const LOCAL_MIDI_OCTAVE_CHANGE = 'LOCAL_MIDI_OCTAVE_CHANGE'
export const localMidiOctaveChange = makeActionCreator(LOCAL_MIDI_OCTAVE_CHANGE, 'delta')

export const localMiddleware: Middleware = ({dispatch, getState}) => next => action => {
	switch (action.type) {
		case LOCAL_MIDI_KEY_PRESS: {
			next(action)
			return dispatch(virtualKeyPressed(selectLocalKeyboardId(getState()), action.midiNote))
		}
		case LOCAL_MIDI_KEY_UP: {
			next(action)
			return dispatch(virtualKeyUp(selectLocalKeyboardId(getState()), action.midiNote))
		}
		case LOCAL_MIDI_OCTAVE_CHANGE: {
			next(action)
			return dispatch(virtualOctaveChange(selectLocalKeyboardId(getState()), action.delta))
		}
		case ADD_CLIENT: {
			next(action)
			const state: IClientAppState = getState()
			if (action.client.socketId === selectLocalSocketId(state)) {
				createLocalStuff(dispatch, state)
			}
			return
		}
		case SET_ACTIVE_ROOM: {
			next(action)
			window.history.pushState({}, document.title, '/' + selectActiveRoom(getState()))
			return deleteAllTheThings(dispatch)
		}
		default:
			return next(action)
	}
}

function createLocalStuff(dispatch: Dispatch, state: IClientAppState) {
	const localClient = selectLocalClient(state)

	const newInstrument = new BasicInstrumentState(localClient.id)
	dispatch(addBasicInstrument(newInstrument))

	const newVirtualKeyboard = new VirtualKeyboardState(localClient.id, localClient.color)
	dispatch(addVirtualKeyboard(newVirtualKeyboard))

	dispatch(addConnection(new Connection(
		newVirtualKeyboard.id,
		ConnectionSourceType.keyboard,
		newInstrument.id,
		ConnectionTargetType.instrument,
	)))
}
