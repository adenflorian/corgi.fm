import {List, Map, Set} from 'immutable'
import {Dispatch, Middleware} from 'redux'
import {ActionType} from 'typesafe-actions'
import uuid from 'uuid'
import {ConnectionNodeType, Id} from '../common/common-types'
import {logger} from '../common/logger'
import {MidiClipEvent} from '../common/midi-types'
import {emptyMidiNotes, IMidiNote} from '../common/MidiNote'
import {BroadcastAction, IClientRoomState} from '../common/redux/common-redux-types'
import {
	selectAllConnections, selectConnectionsWithSourceIds, selectConnectionsWithSourceOrTargetIds,
} from '../common/redux/connections-redux'
import {
	addBasicSampler, addBasicSynthesizer, addPosition, addVirtualKeyboard,
	BasicSamplerState, BasicSynthesizerState, Connection, connectionsActions,
	deleteAllPositions, deleteAllThings, deletePositions, deleteThingsAny,
	getConnectionNodeInfo, gridSequencerActions, IClientAppState, IPosition,
	ISequencerState, LocalSaves,
	makeActionCreator, makePosition,
	MASTER_AUDIO_OUTPUT_TARGET_ID, MASTER_CLOCK_SOURCE_ID, NetworkActionType, READY,
	RECORD_SEQUENCER_NOTE, SavedRoom, selectActiveRoom,
	selectAllPositions, selectClientInfo, selectDirectDownstreamSequencerIds,
	selectGlobalClockState, selectLocalClient,
	selectPositionExtremes, selectRoomSettings,
	selectSequencer,
	selectShamuGraphState,
	selectVirtualKeyboardById,
	selectVirtualKeyboardByOwner,
	sequencerActions,
	SET_ACTIVE_ROOM,
	SET_GRID_SEQUENCER_NOTE,
	ShamuGraphState,
	SKIP_NOTE,
	UPDATE_POSITIONS,
	updatePositions,
	USER_KEY_PRESS,
	UserInputAction,
	UserKeys, VIRTUAL_KEY_PRESSED, VIRTUAL_KEY_UP, VIRTUAL_OCTAVE_CHANGE,
	VirtualKeyboardState, virtualKeyPressed, VirtualKeyPressedAction, virtualKeyUp,
	VirtualKeyUpAction,
	virtualOctaveChange,
	VirtualOctaveChangeAction,
} from '../common/redux/index'
import {pointersActions} from '../common/redux/pointers-redux'
import {graphStateSavesLocalStorageKey} from './client-constants'
import {GetAllInstruments} from './instrument-manager'
import {MidiNotes} from './Instruments/BasicSynthesizerView'
import {applyOctave} from './WebAudio/music-functions'

export const LOCAL_MIDI_KEY_PRESS = 'LOCAL_MIDI_KEY_PRESS'
export const localMidiKeyPress = makeActionCreator(LOCAL_MIDI_KEY_PRESS, 'midiNote')

export const LOCAL_MIDI_KEY_UP = 'LOCAL_MIDI_KEY_UP'
export const localMidiKeyUp = makeActionCreator(LOCAL_MIDI_KEY_UP, 'midiNote')

export const LOCAL_MIDI_OCTAVE_CHANGE = 'LOCAL_MIDI_OCTAVE_CHANGE'
export const localMidiOctaveChange = makeActionCreator(LOCAL_MIDI_OCTAVE_CHANGE, 'delta')

export const WINDOW_BLUR = 'WINDOW_BLUR'
export const windowBlur = makeActionCreator(WINDOW_BLUR)

export const DELETE_NODE = 'DELETE_NODE'
export const deleteNode = makeActionCreator(DELETE_NODE, 'nodeId')

export const SAVE_ROOM_TO_BROWSER = 'SAVE_ROOM_TO_BROWSER'
export const SAVE_ROOM_TO_FILE = 'SAVE_ROOM_TO_FILE'
export const DELETE_SAVED_ROOM = 'DELETE_SAVED_ROOM'

export const localActions = Object.freeze({
	saveRoomToBrowser: () => ({
		type: SAVE_ROOM_TO_BROWSER as typeof SAVE_ROOM_TO_BROWSER,
	}),
	saveRoomToFile: () => ({
		type: SAVE_ROOM_TO_FILE as typeof SAVE_ROOM_TO_FILE,
	}),
	deleteSavedRoom: (id: Id) => ({
		type: DELETE_SAVED_ROOM as typeof DELETE_SAVED_ROOM,
		id,
	}),
})

export type LocalAction = ActionType<typeof localActions>

export const createLocalMiddleware: (getAllInstruments: GetAllInstruments) => Middleware<{}, IClientAppState> =
	(getAllInstruments: GetAllInstruments) => ({dispatch, getState}) => next => action => {
		// TODO Do next later so keyboard is more responsive

		switch (action.type) {
			case WINDOW_BLUR: {
				next(action)

				const state = getState()

				const localVirtualKeyboard = selectLocalVirtualKeyboard(state)

				return localVirtualKeyboard.pressedKeys.forEach(key => {
					dispatch(
						virtualKeyUp(
							localVirtualKeyboard.id,
							key,
						),
					)
				})
			}
			case LOCAL_MIDI_KEY_PRESS: {
				next(action)
				const state = getState()

				const localVirtualKeyboard = selectLocalVirtualKeyboard(state)

				const noteToPlay = applyOctave(action.midiNote, localVirtualKeyboard.octave)

				return dispatch(
					virtualKeyPressed(
						localVirtualKeyboard.id,
						action.midiNote,
						localVirtualKeyboard.octave,
						noteToPlay,
					),
				)
			}
			case VIRTUAL_KEY_PRESSED: {
				const virtualKeyPressedAction = action as VirtualKeyPressedAction

				scheduleNote(
					virtualKeyPressedAction.midiNote, virtualKeyPressedAction.id, getState().room, 'on', getAllInstruments)

				next(action)

				if ((action as unknown as BroadcastAction).alreadyBroadcasted) return

				// add note to sequencer if downstream recording sequencer
				_getDownstreamRecordingSequencers(getState(), virtualKeyPressedAction.id)
					.forEach(x => {
						dispatch(sequencerActions.recordNote(x.id, virtualKeyPressedAction.midiNote))
					})

				return
			}
			case SET_GRID_SEQUENCER_NOTE: {
				const setGridSeqNoteAction = action as ReturnType<typeof gridSequencerActions.setNote>

				if (setGridSeqNoteAction.enabled) {
					playShortNote(setGridSeqNoteAction.note, setGridSeqNoteAction.id, getState().room, getAllInstruments)
				}

				next(action)

				return
			}
			case RECORD_SEQUENCER_NOTE: {
				const recordSeqNoteAction = action as ReturnType<typeof sequencerActions.recordNote>

				playShortNote(recordSeqNoteAction.note, recordSeqNoteAction.id, getState().room, getAllInstruments)

				next(action)

				return
			}
			case SKIP_NOTE: {
				const state = getState()

				// add rest to sequencer if downstream recording sequencer
				_getDownstreamRecordingSequencers(state, selectLocalVirtualKeyboardId(state))
					.forEach(x => {
						dispatch(sequencerActions.recordRest(x.id))
					})

				return next(action)
			}
			case USER_KEY_PRESS: {
				const userKeyPressAction = action as UserInputAction
				if (userKeyPressAction.type === USER_KEY_PRESS) {
					if (userKeyPressAction.key === UserKeys.Backspace) {
						const state = getState()

						// add rest to sequencer if downstream recording sequencer
						_getDownstreamRecordingSequencers(state, selectLocalVirtualKeyboardId(state))
							.forEach(x => {
								dispatch(sequencerActions.undo(x.id))
							})
					}
				}

				return next(action)
			}
			case LOCAL_MIDI_KEY_UP: {
				next(action)
				const state = getState()

				const localVirtualKeyboard = selectLocalVirtualKeyboard(state)

				const noteToRelease = applyOctave(action.midiNote, localVirtualKeyboard.octave)

				scheduleNote(noteToRelease, localVirtualKeyboard.id, state.room, 'off', getAllInstruments)

				return dispatch(
					virtualKeyUp(
						localVirtualKeyboard.id,
						action.midiNote,
					),
				)
			}
			case VIRTUAL_KEY_UP: {
				const virtualKeyUpAction = action as VirtualKeyUpAction

				const state = getState()

				const noteToRelease = applyOctave(
					virtualKeyUpAction.number,
					selectVirtualKeyboardById(state.room, virtualKeyUpAction.id).octave,
				)

				scheduleNote(noteToRelease, virtualKeyUpAction.id, state.room, 'off', getAllInstruments)

				return next(action)
			}
			case LOCAL_MIDI_OCTAVE_CHANGE: {
				next(action)
				// what do for scheduled keyboard notes?
				// release then schedule new ones
				// which ones?
				// all the pressed keys from keyboard state
				const state = getState()

				// const localVirtualKeyboard = getLocalVirtualKeyboard(state)

				// localVirtualKeyboard.pressedKeys.forEach(key => {
				// 	const noteToRelease = applyOctave(key, localVirtualKeyboard.octave)
				// 	const noteToSchedule = applyOctave(key, localVirtualKeyboard.octave + action.delta)
				// 	scheduleNote(noteToRelease, localVirtualKeyboard.id, state.room, 'off')
				// 	scheduleNote(noteToSchedule, localVirtualKeyboard.id, state.room, 'on')
				// })

				return dispatch(virtualOctaveChange(selectLocalVirtualKeyboardId(state), action.delta))
			}
			case VIRTUAL_OCTAVE_CHANGE: {
				const virtualOctaveChangeAction = action as VirtualOctaveChangeAction

				const state = getState()

				const keyboard = selectVirtualKeyboardById(state.room, virtualOctaveChangeAction.id)

				keyboard.pressedKeys.forEach(key => {
					const noteToRelease = applyOctave(key, keyboard.octave)
					const noteToSchedule = applyOctave(key, keyboard.octave + action.delta)
					scheduleNote(noteToRelease, keyboard.id, state.room, 'off', getAllInstruments)
					scheduleNote(noteToSchedule, keyboard.id, state.room, 'on', getAllInstruments)
				})

				return next(action)
			}
			case SET_ACTIVE_ROOM: {
				next(action)
				window.history.pushState({}, document.title, '/' + selectActiveRoom(getState()))
				return
			}
			case READY: {
				next(action)
				return createLocalStuff(dispatch, getState())
			}
			case DELETE_NODE: {
				next(action)

				const newState = getState()

				const nodeId = action.nodeId

				dispatch(deleteThingsAny([nodeId], NetworkActionType.SERVER_AND_BROADCASTER))
				dispatch(deletePositions([nodeId]))
				dispatch(
					connectionsActions.delete(
						selectConnectionsWithSourceOrTargetIds(newState.room, [nodeId])
							.map(x => x.id)
							.toList(),
					),
				)

				return
			}
			case SAVE_ROOM_TO_BROWSER: {
				next(action)

				const state = getState()

				const room = selectActiveRoom(state)

				const localSaves = getOrCreateLocalSavesStorage()

				setLocalSavesToLocalStorage({
					...localSaves,
					all: {
						...localSaves.all,
						[uuid.v4()]: createRoomSave(state, room),
					},
				} as LocalSaves)

				return
			}
			case SAVE_ROOM_TO_FILE: {
				next(action)

				const state = getState()

				const room = selectActiveRoom(state)

				const roomSave = createRoomSave(state, room)

				downloadObjectAsJson(roomSave, `${roomSave.saveDateTime.substring(0, 10)}-room`)

				return
			}
			case DELETE_SAVED_ROOM: {
				next(action)

				const deleteSavedRoomAction = action as ReturnType<typeof localActions.deleteSavedRoom>

				const localSaves = getOrCreateLocalSavesStorage()

				delete localSaves.all[deleteSavedRoomAction.id]

				setLocalSavesToLocalStorage(localSaves)

				return
			}
			case UPDATE_POSITIONS: {
				const updatePositionsAction = action as ReturnType<typeof updatePositions>

				// Mainly to handle loading old saves with smaller sizes
				// Not perfect
				const foo = {
					...updatePositionsAction,
					positions: Map(updatePositionsAction.positions).map(position => {
						const nodeInfo = getConnectionNodeInfo(position.targetType)
						const nodeState = nodeInfo.stateSelector(getState().room, position.id)

						return {
							...position,
							width: Math.max(position.width, nodeState.width),
							height: Math.max(position.height, nodeState.height),
						} as IPosition
					}),
				} as ReturnType<typeof updatePositions>

				next(foo)

				return
			}
			default: return next(action)
		}
	}

function createRoomSave(state: IClientAppState, roomName: string): SavedRoom {
	return Object.freeze({
		connections: selectAllConnections(state.room),
		globalClock: selectGlobalClockState(state.room),
		positions: selectAllPositions(state.room),
		roomSettings: selectRoomSettings(state.room),
		shamuGraph: stripShamuGraphForSaving(selectShamuGraphState(state.room)),
		saveDateTime: new Date().toISOString(),
		saveClientVersion: selectClientInfo(state).clientVersion,
		saveServerVersion: selectClientInfo(state).serverVersion,
		room: roomName,
	})
}

function stripShamuGraphForSaving(shamuGraphState: ShamuGraphState): ShamuGraphState {
	return {
		...shamuGraphState,
		nodes: {
			...shamuGraphState.nodes,
			gridSequencers: {
				things: Map(shamuGraphState.nodes.gridSequencers.things)
					.map(x => ({
						...x,
						previousEvents: List<List<MidiClipEvent>>(),
					}))
					.toObject(),
			},
			infiniteSequencers: {
				things: Map(shamuGraphState.nodes.infiniteSequencers.things)
					.map(x => ({
						...x,
						previousEvents: List<List<MidiClipEvent>>(),
					}))
					.toObject(),
			},
		},
	}
}

function setLocalSavesToLocalStorage(localSaves: LocalSaves) {
	localStorage.setItem(graphStateSavesLocalStorageKey, JSON.stringify(localSaves))
}

// https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
function downloadObjectAsJson(exportObj: any, exportName: string) {
	const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj))
	const downloadAnchorNode = document.createElement('a')
	downloadAnchorNode.setAttribute('href', dataStr)
	downloadAnchorNode.setAttribute('download', exportName + '.json')
	document.body.appendChild(downloadAnchorNode) // required for firefox
	downloadAnchorNode.click()
	downloadAnchorNode.remove()
}

export function getOrCreateLocalSavesStorage(): LocalSaves {
	const localSavesJSON = localStorage.getItem(graphStateSavesLocalStorageKey)

	if (localSavesJSON === null) return makeInitialLocalSavesStorage()

	const localSaves = parseLocalSavesJSON(localSavesJSON)

	// TODO Properly deserialize, checking for null stuff and versions, etc.

	return localSaves
}

function parseLocalSavesJSON(localSavesJSON: string): LocalSaves {
	try {
		const localSaves = JSON.parse(localSavesJSON) as LocalSaves

		if (!localSaves) {
			logger.warn('failed to parse localSavesJSON, was null after casting: ', localSavesJSON)
			return makeInitialLocalSavesStorage()
		} else {
			return localSaves
		}
	} catch (error) {
		logger.error('error caught while trying to parse localSavesJSON: ', error)
		logger.error('localSavesJSON: ', localSavesJSON)
		return makeInitialLocalSavesStorage()
	}
}

const makeInitialLocalSavesStorage = (): LocalSaves => Object.freeze({
	all: {},
})

let _previousNotesForSourceId = Map<string, MidiNotes>()

function scheduleNote(
	note: IMidiNote,
	sourceId: string,
	roomState: IClientRoomState,
	onOrOff: 'on' | 'off',
	getAllInstruments: GetAllInstruments,
) {
	if (_previousNotesForSourceId.has(sourceId) === false) {
		_previousNotesForSourceId = _previousNotesForSourceId.set(sourceId, emptyMidiNotes)
	}

	const previousNotes = _previousNotesForSourceId.get(sourceId, emptyMidiNotes)

	if (onOrOff === 'on') {
		if (previousNotes.includes(note)) {
			return
		} else {
			_previousNotesForSourceId = _previousNotesForSourceId.update(sourceId, x => x.add(note))
		}
	} else {
		if (previousNotes.includes(note)) {
			_previousNotesForSourceId = _previousNotesForSourceId.update(sourceId, x => x.remove(note))
		} else {
			return
		}
	}

	// logger.log('[local-middleware.scheduleNote] note: ' + note + ' | onOrOff: ' + onOrOff)

	const targetIds = selectConnectionsWithSourceIds(roomState, [sourceId]).map(x => x.targetId)

	getAllInstruments().forEach(instrument => {
		if (targetIds.includes(instrument.id) === false) return

		if (onOrOff === 'on') {
			instrument.scheduleNote(note, 0, true, Set([sourceId]))
		} else {
			instrument.scheduleRelease(note, 0)
		}
	})
}

function playShortNote(
	note: IMidiNote, sourceId: string, roomState: IClientRoomState,
	getAllInstruments: GetAllInstruments,
) {
	const targetIds = selectConnectionsWithSourceIds(roomState, [sourceId]).map(x => x.targetId)
	const {gate, rate} = selectSequencer(roomState, sourceId)
	const bpm = selectGlobalClockState(roomState).bpm

	const delay = (60 / bpm) * rate * gate

	getAllInstruments().forEach(instrument => {
		if (targetIds.includes(instrument.id) === false) return

		instrument.scheduleNote(note, 0, true, Set([sourceId]))

		instrument.scheduleRelease(note, delay)
	})
}

function selectLocalVirtualKeyboardId(state: IClientAppState) {
	return selectLocalVirtualKeyboard(state).id
}

function selectLocalVirtualKeyboard(state: IClientAppState) {
	return selectVirtualKeyboardByOwner(state.room, selectLocalClient(state).id)
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
		...newVirtualKeyboard,
		id: newVirtualKeyboard.id,
		targetType: ConnectionNodeType.virtualKeyboard,
		x: -556,
		y: extremes.bottomMost + y,
		width: VirtualKeyboardState.defaultWidth,
		height: VirtualKeyboardState.defaultHeight,
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
			...newSampler,
			id: newSampler.id,
			targetType: ConnectionNodeType.basicSampler,
			width: BasicSamplerState.defaultWidth,
			height: BasicSamplerState.defaultHeight,
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
	} else {
		const newInstrument = new BasicSynthesizerState(localClient.id)
		dispatch(addBasicSynthesizer(newInstrument))
		const instrumentPosition = makePosition({
			...newInstrument,
			id: newInstrument.id,
			targetType: ConnectionNodeType.basicSynthesizer,
			width: BasicSynthesizerState.defaultWidth,
			height: BasicSynthesizerState.defaultHeight,
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
	}
}

function _getDownstreamRecordingSequencers(
	state: IClientAppState, nodeId: string): List<ISequencerState> {

	return selectDirectDownstreamSequencerIds(state.room, nodeId)
		.map(x => selectSequencer(state.room, x))
		.filter(x => x.isRecording)
}
