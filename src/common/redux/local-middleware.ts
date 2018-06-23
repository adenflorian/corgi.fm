import {Middleware} from 'redux'
import {makeActionCreator} from './redux-utils'
import {virtualKeyPressed, virtualKeyUp, virtualOctaveChange} from './virtual-keyboard-redux'
import {selectLocalClientId} from './websocket-redux'

export const LOCAL_MIDI_KEY_PRESS = 'LOCAL_MIDI_KEY_PRESS'
export const localMidiKeyPress = makeActionCreator(LOCAL_MIDI_KEY_PRESS, 'midiNote')

export const LOCAL_MIDI_KEY_UP = 'LOCAL_MIDI_KEY_UP'
export const localMidiKeyUp = makeActionCreator(LOCAL_MIDI_KEY_UP, 'midiNote')

export const LOCAL_MIDI_OCTAVE_CHANGE = 'LOCAL_MIDI_OCTAVE_CHANGE'
export const localMidiOctaveChange = makeActionCreator(LOCAL_MIDI_OCTAVE_CHANGE, 'delta')

export const localMiddleware: Middleware = ({dispatch, getState}) => next => action => {
	switch (action.type) {
		case LOCAL_MIDI_KEY_PRESS: {
			const localClientId = selectLocalClientId(getState())
			next(action)
			return dispatch(virtualKeyPressed(localClientId, action.midiNote))
		}
		case LOCAL_MIDI_KEY_UP: {
			const localClientId = selectLocalClientId(getState())
			next(action)
			return dispatch(virtualKeyUp(localClientId, action.midiNote))
		}
		case LOCAL_MIDI_OCTAVE_CHANGE: {
			const localClientId = selectLocalClientId(getState())
			next(action)
			return dispatch(virtualOctaveChange(localClientId, action.delta))
		}
		default:
			return next(action)
	}
}
