import {Dispatch, Middleware} from 'redux'
import {useSchedulerForKeyboards} from '../../client/client-toggles'
import {getAllInstruments} from '../../client/instrument-manager'
import {isNewNoteScannerEnabled} from '../../client/is-prod-client'
import {applyOctave} from '../../client/WebAudio/music-functions'
import {ConnectionNodeType} from '../common-types'
import {isClient} from '../is-client-or-server'
import {logger} from '../logger'
import {emptyMidiNotes, IMidiNote} from '../MidiNote'
import {IClientRoomState} from './common-redux-types'
import {selectConnectionsWithSourceIds} from './connections-redux'
import {addBasicSampler, addBasicSynthesizer, addPosition, addVirtualKeyboard, BasicSamplerState, BasicSynthesizerState, Connection, connectionsActions, deleteAllPositions, deleteAllThings, IClientAppState, makeActionCreator, makePosition, MASTER_AUDIO_OUTPUT_TARGET_ID, MASTER_CLOCK_SOURCE_ID, READY, selectActiveRoom, selectLocalClient, selectPositionExtremes, selectVirtualKeyboardById, selectVirtualKeyboardIdByOwner, SET_ACTIVE_ROOM, VirtualKeyboardState, virtualKeyPressed, virtualKeyUp, virtualOctaveChange} from './index'
import {pointersActions} from './pointers-redux'

export const LOCAL_MIDI_KEY_PRESS = 'LOCAL_MIDI_KEY_PRESS'
export const localMidiKeyPress = makeActionCreator(LOCAL_MIDI_KEY_PRESS, 'midiNote')

export const LOCAL_MIDI_KEY_UP = 'LOCAL_MIDI_KEY_UP'
export const localMidiKeyUp = makeActionCreator(LOCAL_MIDI_KEY_UP, 'midiNote')

export const LOCAL_MIDI_OCTAVE_CHANGE = 'LOCAL_MIDI_OCTAVE_CHANGE'
export const localMidiOctaveChange = makeActionCreator(LOCAL_MIDI_OCTAVE_CHANGE, 'delta')

export function deleteAllTheThings(dispatch: Dispatch) {
	dispatch(connectionsActions.deleteAll())
	dispatch(deleteAllThings(ConnectionNodeType.gridSequencer))
	dispatch(deleteAllThings(ConnectionNodeType.virtualKeyboard))
	dispatch(deleteAllThings(ConnectionNodeType.basicSynthesizer))
	dispatch(deleteAllThings(ConnectionNodeType.basicSampler))
	dispatch(deleteAllPositions())
}

export const createLocalMiddleware: () => Middleware<{}, IClientAppState> = () => ({dispatch, getState}) => next => action => {
	next(action)
	switch (action.type) {
		case LOCAL_MIDI_KEY_PRESS: {
			const state = getState()

			const localVirtualKeyboard = getLocalVirtualKeyboard(state)

			const noteToPlay = applyOctave(action.midiNote, localVirtualKeyboard.octave)

			scheduleNote(noteToPlay, localVirtualKeyboard.id, state.room, 'on')

			return dispatch(
				virtualKeyPressed(
					localVirtualKeyboard.id,
					action.midiNote,
					localVirtualKeyboard.octave,
					noteToPlay,
				),
			)
		}
		case LOCAL_MIDI_KEY_UP: {
			const state = getState()

			const localVirtualKeyboard = getLocalVirtualKeyboard(state)

			const noteToRelease = applyOctave(action.midiNote, localVirtualKeyboard.octave)

			scheduleNote(noteToRelease, localVirtualKeyboard.id, state.room, 'off')

			return dispatch(
				virtualKeyUp(
					localVirtualKeyboard.id,
					action.midiNote,
				),
			)
		}
		case LOCAL_MIDI_OCTAVE_CHANGE: {
			// what do for scheduled keyboard notes?
			// release then schedule new ones
			// which ones?
			// all the pressed keys from keyboard state
			const state = getState()

			const localVirtualKeyboard = getLocalVirtualKeyboard(state)

			localVirtualKeyboard.pressedKeys.forEach(key => {
				const noteToRelease = applyOctave(key, localVirtualKeyboard.octave)
				const noteToSchedule = applyOctave(key, localVirtualKeyboard.octave + action.delta)
				scheduleNote(noteToRelease, localVirtualKeyboard.id, state.room, 'off')
				scheduleNote(noteToSchedule, localVirtualKeyboard.id, state.room, 'on')
			})

			return dispatch(virtualOctaveChange(getLocalVirtualKeyboardId(state), action.delta))
		}
		case SET_ACTIVE_ROOM: {
			window.history.pushState({}, document.title, '/' + selectActiveRoom(getState()))
			return deleteAllTheThings(dispatch)
		}
		case READY: {
			return createLocalStuff(dispatch, getState())
		}
	}
}

let _previousNotes = emptyMidiNotes

function scheduleNote(note: IMidiNote, sourceId: string, roomState: IClientRoomState, onOrOff: 'on' | 'off') {
	if (isClient() && isNewNoteScannerEnabled() === false) return
	if (useSchedulerForKeyboards() === false) return

	if (onOrOff === 'on') {
		if (_previousNotes.includes(note)) {
			return
		} else {
			_previousNotes = _previousNotes.add(note)
		}
	} else {
		if (_previousNotes.includes(note)) {
			_previousNotes = _previousNotes.remove(note)
		} else {
			return
		}
	}

	logger.log('[local-middleware.scheduleNote] note: ' + note + ' | onOrOff: ' + onOrOff)

	const targetIds = selectConnectionsWithSourceIds(roomState, [sourceId]).map(x => x.targetId)

	getAllInstruments().forEach(instrument => {
		if (targetIds.includes(instrument.id) === false) return

		if (onOrOff === 'on') {
			instrument.scheduleNote(note, 0)
		} else {
			instrument.scheduleRelease(note, 0)
		}
	})
}

function getLocalVirtualKeyboardId(state: IClientAppState) {
	return selectVirtualKeyboardIdByOwner(state.room, selectLocalClient(state).id)
}

function getLocalVirtualKeyboard(state: IClientAppState) {
	return selectVirtualKeyboardById(state.room, getLocalVirtualKeyboardId(state))
}

// TODO Refactor to use functions in create-server-stuff.ts
function createLocalStuff(dispatch: Dispatch, state: IClientAppState) {
	const localClient = selectLocalClient(state)

	if (localClient.name.startsWith('fake')) {
		logger.warn('FAKE')
		return
	}

	dispatch(pointersActions.add(localClient.id))

	const extremes = selectPositionExtremes(state.room)

	const y = 96

	const newVirtualKeyboard = new VirtualKeyboardState(localClient.id, localClient.color)
	dispatch(addVirtualKeyboard(newVirtualKeyboard))
	const keyboardPosition = makePosition({
		id: newVirtualKeyboard.id,
		targetType: ConnectionNodeType.virtualKeyboard,
		x: -556,
		y: extremes.bottomMost + y,
	})
	dispatch(addPosition({
		...keyboardPosition,
		y: keyboardPosition.y - (keyboardPosition.height / 2),
	}))

	const nextPosition = {
		x: 24,
		y: extremes.bottomMost + y,
	}

	if (localClient.name.toLowerCase() === '$sampler') {
		const newSampler = new BasicSamplerState(localClient.id)
		dispatch(addBasicSampler(newSampler))
		const samplerPosition = makePosition({
			id: newSampler.id,
			targetType: ConnectionNodeType.basicSampler,
			...nextPosition,
		})
		dispatch(addPosition({
			...samplerPosition,
			y: samplerPosition.y - (samplerPosition.height / 2),
		}))

		// Source to target
		dispatch(connectionsActions.add(new Connection(
			newVirtualKeyboard.id,
			ConnectionNodeType.virtualKeyboard,
			newSampler.id,
			ConnectionNodeType.basicSampler,
		)))

		// Target to audio output
		dispatch(connectionsActions.add(new Connection(
			newSampler.id,
			ConnectionNodeType.basicSampler,
			MASTER_AUDIO_OUTPUT_TARGET_ID,
			ConnectionNodeType.audioOutput,
		)))

		// Master clock to source
		dispatch(connectionsActions.add(new Connection(
			MASTER_CLOCK_SOURCE_ID,
			ConnectionNodeType.masterClock,
			newVirtualKeyboard.id,
			ConnectionNodeType.virtualKeyboard,
		)))
	} else {
		const newInstrument = new BasicSynthesizerState(localClient.id)
		dispatch(addBasicSynthesizer(newInstrument))
		const instrumentPosition = makePosition({
			id: newInstrument.id,
			targetType: ConnectionNodeType.basicSynthesizer,
			...nextPosition,
		})
		dispatch(addPosition({
			...instrumentPosition,
			y: instrumentPosition.y - (instrumentPosition.height / 2),
		}))

		// Source to target
		dispatch(connectionsActions.add(new Connection(
			newVirtualKeyboard.id,
			ConnectionNodeType.virtualKeyboard,
			newInstrument.id,
			ConnectionNodeType.basicSynthesizer,
		)))

		// Target to audio output
		dispatch(connectionsActions.add(new Connection(
			newInstrument.id,
			ConnectionNodeType.basicSynthesizer,
			MASTER_AUDIO_OUTPUT_TARGET_ID,
			ConnectionNodeType.audioOutput,
		)))

		// Master clock to source
		dispatch(connectionsActions.add(new Connection(
			MASTER_CLOCK_SOURCE_ID,
			ConnectionNodeType.masterClock,
			newVirtualKeyboard.id,
			ConnectionNodeType.virtualKeyboard,
		)))
	}
}
