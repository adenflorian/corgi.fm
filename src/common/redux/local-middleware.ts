import {Dispatch, Middleware} from 'redux'
import {applyOctave} from '../../client/music/music-functions'
import {logger} from '../logger'
import {addBasicInstrument, BasicInstrumentState} from './basic-instruments-redux'
import {addBasicSampler, BasicSamplerState} from './basic-sampler-redux'
import {selectLocalClient} from './clients-redux'
import {IClientAppState} from './common-redux-types'
import {
	addConnection, Connection, ConnectionNodeType, deleteAllConnections,
	MASTER_AUDIO_OUTPUT_TARGET_ID, MASTER_CLOCK_SOURCE_ID,
} from './connections-redux'
import {deleteAllThings, MultiThingType} from './multi-reducer'
import {addPosition, deleteAllPositions, Position} from './positions-redux'
import {makeActionCreator} from './redux-utils'
import {selectActiveRoom, SET_ACTIVE_ROOM} from './rooms-redux'
import {
	addVirtualKeyboard, selectVirtualKeyboardById,
	selectVirtualKeyboardIdByOwner, VirtualKeyboardState, virtualKeyPressed, virtualKeyUp, virtualOctaveChange,
} from './virtual-keyboard-redux'

export const LOCAL_MIDI_KEY_PRESS = 'LOCAL_MIDI_KEY_PRESS'
export const localMidiKeyPress = makeActionCreator(LOCAL_MIDI_KEY_PRESS, 'midiNote')

export const LOCAL_MIDI_KEY_UP = 'LOCAL_MIDI_KEY_UP'
export const localMidiKeyUp = makeActionCreator(LOCAL_MIDI_KEY_UP, 'midiNote')

export const LOCAL_MIDI_OCTAVE_CHANGE = 'LOCAL_MIDI_OCTAVE_CHANGE'
export const localMidiOctaveChange = makeActionCreator(LOCAL_MIDI_OCTAVE_CHANGE, 'delta')

export function deleteAllTheThings(dispatch: Dispatch) {
	dispatch(deleteAllConnections())
	dispatch(deleteAllThings(MultiThingType.gridSequencer))
	dispatch(deleteAllThings(MultiThingType.virtualKeyboard))
	dispatch(deleteAllThings(MultiThingType.basicInstrument))
	dispatch(deleteAllThings(MultiThingType.basicSampler))
	dispatch(deleteAllPositions())
}

export const localMiddleware: Middleware<{}, IClientAppState> = ({dispatch, getState}) => next => action => {
	next(action)
	switch (action.type) {
		case LOCAL_MIDI_KEY_PRESS: {
			const localVirtualKeyboard = getLocalVirtualKeyboard(getState())
			return dispatch(
				virtualKeyPressed(
					localVirtualKeyboard.id,
					action.midiNote,
					localVirtualKeyboard.octave,
					applyOctave(action.midiNote, localVirtualKeyboard.octave)),
			)
		}
		case LOCAL_MIDI_KEY_UP: {
			return dispatch(virtualKeyUp(getLocalVirtualKeyboardId(getState()), action.midiNote))
		}
		case LOCAL_MIDI_OCTAVE_CHANGE: {
			return dispatch(virtualOctaveChange(getLocalVirtualKeyboardId(getState()), action.delta))
		}
		case SET_ACTIVE_ROOM: {
			window.history.pushState({}, document.title, '/' + selectActiveRoom(getState()))
			deleteAllTheThings(dispatch)
			return createLocalStuff(dispatch, getState())
		}
	}
}

function getLocalVirtualKeyboardId(state: IClientAppState) {
	return selectVirtualKeyboardIdByOwner(state.room, selectLocalClient(state).id)
}

function getLocalVirtualKeyboard(state: IClientAppState) {
	return selectVirtualKeyboardById(state.room, getLocalVirtualKeyboardId(state))
}

function createLocalStuff(dispatch: Dispatch, state: IClientAppState) {
	const localClient = selectLocalClient(state)

	if (localClient.name.startsWith('fake')) {
		logger.warn('FAKE')
		return
	}

	const newVirtualKeyboard = new VirtualKeyboardState(localClient.id, localClient.color)
	dispatch(addVirtualKeyboard(newVirtualKeyboard))
	dispatch(addPosition(new Position(newVirtualKeyboard.id, ConnectionNodeType.keyboard)))

	if (localClient.name.toLowerCase() === '$sampler') {
		const newSampler = new BasicSamplerState(localClient.id)
		dispatch(addBasicSampler(newSampler))
		dispatch(addPosition(new Position(newSampler.id, ConnectionNodeType.sampler)))

		// Source to target
		dispatch(addConnection(new Connection(
			newVirtualKeyboard.id,
			ConnectionNodeType.keyboard,
			newSampler.id,
			ConnectionNodeType.sampler,
		)))

		// Target to audio output
		dispatch(addConnection(new Connection(
			newSampler.id,
			ConnectionNodeType.sampler,
			MASTER_AUDIO_OUTPUT_TARGET_ID,
			ConnectionNodeType.audioOutput,
		)))

		// Master clock to source
		dispatch(addConnection(new Connection(
			MASTER_CLOCK_SOURCE_ID,
			ConnectionNodeType.masterClock,
			newVirtualKeyboard.id,
			ConnectionNodeType.keyboard,
		)))
	} else {
		const newInstrument = new BasicInstrumentState(localClient.id)
		dispatch(addBasicInstrument(newInstrument))
		dispatch(addPosition(new Position(newInstrument.id, ConnectionNodeType.instrument)))

		// Source to target
		dispatch(addConnection(new Connection(
			newVirtualKeyboard.id,
			ConnectionNodeType.keyboard,
			newInstrument.id,
			ConnectionNodeType.instrument,
		)))

		// Target to audio output
		dispatch(addConnection(new Connection(
			newInstrument.id,
			ConnectionNodeType.instrument,
			MASTER_AUDIO_OUTPUT_TARGET_ID,
			ConnectionNodeType.audioOutput,
		)))

		// Master clock to source
		dispatch(addConnection(new Connection(
			MASTER_CLOCK_SOURCE_ID,
			ConnectionNodeType.masterClock,
			newVirtualKeyboard.id,
			ConnectionNodeType.keyboard,
		)))
	}
}
