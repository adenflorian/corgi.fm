import {Dispatch, Middleware} from 'redux'
import {addBasicInstrument, BasicInstrumentState} from './basic-instruments-redux'
import {ADD_CLIENT, selectLocalClient} from './clients-redux'
import {IClientAppState} from './common-redux-types'
import {
	addConnection, Connection, ConnectionSourceType, ConnectionTargetType, deleteAllConnections,
} from './connections-redux'
import {deleteAllThings, MultiThingType} from './multi-reducer'
import {makeActionCreator} from './redux-utils'
import {selectActiveRoom, SET_ACTIVE_ROOM} from './rooms-redux'
import {
	addVirtualKeyboard, selectVirtualKeyboardIdByOwner,
	VirtualKeyboardState, virtualKeyPressed, virtualKeyUp, virtualOctaveChange,
} from './virtual-keyboard-redux'
import {selectLocalSocketId} from './websocket-redux'

export const LOCAL_MIDI_KEY_PRESS = 'LOCAL_MIDI_KEY_PRESS'
export const localMidiKeyPress = makeActionCreator(LOCAL_MIDI_KEY_PRESS, 'midiNote')

export const LOCAL_MIDI_KEY_UP = 'LOCAL_MIDI_KEY_UP'
export const localMidiKeyUp = makeActionCreator(LOCAL_MIDI_KEY_UP, 'midiNote')

export const LOCAL_MIDI_OCTAVE_CHANGE = 'LOCAL_MIDI_OCTAVE_CHANGE'
export const localMidiOctaveChange = makeActionCreator(LOCAL_MIDI_OCTAVE_CHANGE, 'delta')

export function deleteAllTheThings(dispatch: Dispatch) {
	dispatch(deleteAllConnections())
	dispatch(deleteAllThings(MultiThingType.track))
	dispatch(deleteAllThings(MultiThingType.virtualKeyboard))
	dispatch(deleteAllThings(MultiThingType.basicInstrument))
}

export const localMiddleware: Middleware<{}, IClientAppState> = ({dispatch, getState}) => next => action => {
	switch (action.type) {
		case LOCAL_MIDI_KEY_PRESS: {
			next(action)
			return dispatch(virtualKeyPressed(getLocalVirtualKeyboardId(getState()), action.midiNote))
		}
		case LOCAL_MIDI_KEY_UP: {
			next(action)
			return dispatch(virtualKeyUp(getLocalVirtualKeyboardId(getState()), action.midiNote))
		}
		case LOCAL_MIDI_OCTAVE_CHANGE: {
			next(action)
			return dispatch(virtualOctaveChange(getLocalVirtualKeyboardId(getState()), action.delta))
		}
		case ADD_CLIENT: {
			next(action)
			return
		}
		case SET_ACTIVE_ROOM: {
			next(action)
			window.history.pushState({}, document.title, '/' + selectActiveRoom(getState()))
			deleteAllTheThings(dispatch)
			return createLocalStuff(dispatch, getState())
		}
		default:
			return next(action)
	}
}

function getLocalVirtualKeyboardId(state: IClientAppState) {
	return selectVirtualKeyboardIdByOwner(state.room, selectLocalClient(state).id)
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
