import {List, Map, Set} from 'immutable'
import {Dispatch, Middleware} from 'redux'
import uuid from 'uuid'
import {MAX_MIDI_NOTE_NUMBER_127} from '@corgifm/common/common-constants'
import {ConnectionNodeType, IMultiStateThing} from '@corgifm/common/common-types'
import {applyOctave, createNodeId} from '@corgifm/common/common-utils'
import {logger} from '@corgifm/common/logger'
import {MidiClipEvent} from '@corgifm/common/midi-types'
import {emptyMidiNotes, IMidiNote} from '@corgifm/common/MidiNote'
import {BroadcastAction, IClientRoomState} from '@corgifm/common/redux/common-redux-types'
import {
	selectAllConnections, selectConnectionsWithSourceIds,
	selectConnectionsWithSourceOrTargetIds, selectConnectionsWithTargetIds,
	doesConnectionBetweenNodesExist,
} from '@corgifm/common/redux/connections-redux'
import {
	addBasicSynthesizer, AddClientAction,
	addMultiThing, addPosition, addVirtualKeyboard,
	BasicSynthesizerState, Connection,
	connectionsActions, deletePositions, deleteThingsAny, findNodeInfo,
	GridSequencerAction,
	gridSequencerActions, GridSequencerFields, GridSequencerState, IClientAppState,
	IPosition, ISequencerState, LocalSaves, makePosition,
	MASTER_AUDIO_OUTPUT_TARGET_ID, MASTER_CLOCK_SOURCE_ID,
	NetworkActionType, ReadyAction, SavedRoom, selectActiveRoom,
	selectAllPositions,
	selectClientInfo,
	selectDirectDownstreamSequencerIds,
	selectGlobalClockState,
	selectLocalClient,
	selectLocalClientId,
	selectLocalSocketId,
	selectPosition,
	selectPositionExtremes,
	selectRoomSettings, selectSequencer, selectShamuGraphState, selectVirtualKeyboardById,
	selectVirtualKeyboardByOwner, sequencerActions,
	SetActiveRoomAction, setClientName, setLocalClientId,
	SetLocalClientNameAction,
	ShamuGraphState,
	shamuMetaActions,
	UpdatePositionsAction,
	UserInputAction,
	UserKeys,
	VirtualKeyboardState,
	virtualKeyPressed,
	VirtualKeyPressedAction,
	virtualKeyUp,
	VirtualKeyUpAction,
	virtualOctaveChange,
	VirtualOctaveChangeAction,
	LocalAction, chatSystemMessage, animationActions, selectOption, AppOptions, getNodeInfo,
} from '@corgifm/common/redux'
import {pointersActions} from '@corgifm/common/redux/pointers-redux'
import {CssColor} from '@corgifm/common/shamu-color'
import {graphStateSavesLocalStorageKey} from './client-constants'
import {GetAllInstruments} from './instrument-manager'
import {MidiNotes} from './Instruments/BasicSynthesizerView'
import {getSequencersSchedulerInfo} from './note-scanner'
import {saveUsernameToLocalStorage} from './username'
import {corgiApiActions} from './RestClient/corgi-api-middleware'
import {FirebaseContextStuff} from './Firebase/FirebaseContext'
import {onChangeRoom} from './WebAudio'

type LocalMiddlewareActions = LocalAction | AddClientAction | VirtualKeyPressedAction | GridSequencerAction
| UserInputAction | VirtualKeyUpAction | VirtualOctaveChangeAction | SetActiveRoomAction | ReadyAction
| UpdatePositionsAction | SetLocalClientNameAction

export function createLocalMiddleware(
	getAllInstruments: GetAllInstruments, firebase: FirebaseContextStuff
): Middleware<{}, IClientAppState> {
	return ({dispatch, getState}) => next => async (action: LocalMiddlewareActions) => {
		// TODO Do next later so keyboard is more responsive

		switch (action.type) {
			case 'WINDOW_BLUR': {
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
			case 'LOCAL_MIDI_KEY_PRESS': {
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
			case 'VIRTUAL_KEY_PRESSED': {
				scheduleNote(
					action.midiNote, action.id, getState(), 'on',
					getAllInstruments, dispatch)

				next(action)

				if ((action as unknown as BroadcastAction).alreadyBroadcasted) return

				const state = getState()

				// add note to sequencer if downstream recording sequencer
				_getDownstreamRecordingSequencers(state, action.id)
					.forEach(sequencer => {
						const info = getSequencersSchedulerInfo().get(sequencer.id, null)

						if (!info) return dispatch(sequencerActions.recordNote(sequencer.id, action.midiNote))

						const eventCount = sequencer.midiClip.events.count()

						const index = Math.ceil((eventCount * info.loopRatio) + 0.5) - 1

						const actualIndex = index >= eventCount ? 0 : index

						if (sequencer.type === ConnectionNodeType.gridSequencer) {
							const gridSequencer = sequencer as GridSequencerState

							const actualMidiNote = Math.min(MAX_MIDI_NOTE_NUMBER_127 - 1, Math.max(0, action.midiNote))

							const topNote = gridSequencer.scrollY + GridSequencerState.notesToShow - 1

							let needToScroll = 0

							// determine if new note is out of view
							if (actualMidiNote < gridSequencer.scrollY) {
								needToScroll = actualMidiNote - gridSequencer.scrollY
							} else if (actualMidiNote > topNote) {
								needToScroll = actualMidiNote - topNote
							}

							if (needToScroll !== 0) {
								dispatch(gridSequencerActions.setField(gridSequencer.id, GridSequencerFields.scrollY, gridSequencer.scrollY + needToScroll))
							}

							return dispatch(sequencerActions.recordNote(sequencer.id, actualMidiNote, actualIndex))
						} else {
							return dispatch(sequencerActions.recordNote(sequencer.id, action.midiNote, actualIndex))
						}
					})

				return
			}
			case 'SET_GRID_SEQUENCER_NOTE': {
				if (action.enabled) {
					playShortNote(action.note, action.id, getState().room, getAllInstruments)
				}

				next(action)

				return
			}
			case 'PLAY_SHORT_NOTE': {
				playShortNote(action.note, action.sourceId, getState().room, getAllInstruments)

				next(action)

				return
			}
			case 'PLAY_SHORT_NOTE_ON_TARGET': {
				playShortNoteOnTarget(action.note, action.targetId, getState().room, getAllInstruments)

				next(action)

				return
			}
			case 'SKIP_NOTE': {
				const state = getState()

				// add rest to sequencer if downstream recording sequencer
				_getDownstreamRecordingSequencers(state, selectLocalVirtualKeyboardId(state))
					.forEach(x => {
						dispatch(sequencerActions.recordRest(x.id))
					})

				return next(action)
			}
			case 'USER_KEY_PRESS': {
				if (action.key === UserKeys.Backspace) {
					const state = getState()

					// add rest to sequencer if downstream recording sequencer
					_getDownstreamRecordingSequencers(state, selectLocalVirtualKeyboardId(state))
						.forEach(x => {
							dispatch(sequencerActions.undo(x.id))
						})
				}

				return next(action)
			}
			case 'LOCAL_MIDI_KEY_UP': {
				next(action)
				const state = getState()

				const localVirtualKeyboard = selectLocalVirtualKeyboard(state)

				const noteToRelease = applyOctave(action.midiNote, localVirtualKeyboard.octave)

				scheduleNote(noteToRelease, localVirtualKeyboard.id, state, 'off',
					getAllInstruments, dispatch)

				return dispatch(
					virtualKeyUp(
						localVirtualKeyboard.id,
						action.midiNote,
					),
				)
			}
			case 'VIRTUAL_KEY_UP': {
				const state = getState()

				const noteToRelease = applyOctave(
					action.number,
					selectVirtualKeyboardById(state.room, action.id).octave,
				)

				scheduleNote(noteToRelease, action.id, state, 'off',
					getAllInstruments, dispatch)

				return next(action)
			}
			case 'LOCAL_MIDI_OCTAVE_CHANGE': {
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
			case 'VIRTUAL_OCTAVE_CHANGE': {
				const state = getState()

				const keyboard = selectVirtualKeyboardById(state.room, action.id)

				keyboard.pressedKeys.forEach(key => {
					const noteToRelease = applyOctave(key, keyboard.octave)
					const noteToSchedule = applyOctave(key, keyboard.octave + action.delta)
					scheduleNote(noteToRelease, keyboard.id, state, 'off',
						getAllInstruments, dispatch)
					scheduleNote(noteToSchedule, keyboard.id, state, 'on',
						getAllInstruments, dispatch)
				})

				return next(action)
			}
			case 'SET_LOCAL_CLIENT_NAME': {
				next(action)
				const localClient = selectLocalClient(getState())
				dispatch(setClientName(localClient.id, action.newName))
				saveUsernameToLocalStorage(action.newName)
				if (firebase.auth.currentUser) dispatch(corgiApiActions.saveLocalUser())
				return
			}
			case 'SET_ACTIVE_ROOM': {
				next(action)
				window.history.pushState({}, document.title, '/' + selectActiveRoom(getState()))
				onChangeRoom()
				const active: HTMLElement | null = document.activeElement as HTMLElement
				if (active && active.blur) active.blur()
				return
			}
			case 'ADD_CLIENT': {
				next(action)
				if (action.client.socketId === selectLocalSocketId(getState())) {
					dispatch(setLocalClientId(action.client.id))
				}
				return
			}
			case 'READY': {
				next(action)
				return createLocalStuff(dispatch, getState())
			}
			case 'DELETE_NODE': {
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
			case 'CLONE_NODE': {
				next(action)

				const newState = getState()

				const nodeId = action.nodeId
				const nodeType = action.nodeType

				// Select multiThing
				const nodeInfo = findNodeInfo(action.nodeType)

				const stateToClone = nodeInfo.stateSelector(newState.room, nodeId)

				const clone: IMultiStateThing = {
					...stateToClone,
					id: createNodeId(),
				}

				// dispatch add multi thing
				dispatch(addMultiThing(clone, nodeType, NetworkActionType.SERVER_AND_BROADCASTER))
				dispatch(shamuMetaActions.setSelectedNode({id: clone.id, type: clone.type}))

				// clone position
				const positionToClone = selectPosition(newState.room, nodeId)

				const clonePosition: IPosition = {
					...positionToClone,
					id: clone.id,
					x: positionToClone.x + 32,
					y: positionToClone.y + 32,
				}

				dispatch(addPosition(clonePosition))

				if (action.withConnections === 'all') {
					const newConnections = selectConnectionsWithSourceIds(newState.room, [nodeId])
						.map(x => ({
							...x,
							id: createNodeId(),
							sourceId: clone.id,
						}))
						.concat(
							selectConnectionsWithTargetIds(newState.room, [nodeId])
								.map(x => ({
									...x,
									id: createNodeId(),
									targetId: clone.id,
								})),
						)
						.toList()

					if (newConnections.count() > 0) dispatch(connectionsActions.addMultiple(newConnections))
				} else if (action.withConnections === 'default') {
					if (nodeInfo.autoConnectToClock) {
						dispatch(connectionsActions.add(new Connection(
							MASTER_CLOCK_SOURCE_ID,
							ConnectionNodeType.masterClock,
							clone.id,
							clone.type,
							0,
							0,
						)))
					}
					if (nodeInfo.autoConnectToAudioOutput) {
						dispatch(connectionsActions.add(new Connection(
							clone.id,
							clone.type,
							MASTER_AUDIO_OUTPUT_TARGET_ID,
							ConnectionNodeType.audioOutput,
							0,
							0,
						)))
					}
				}

				return
			}
			case 'PRUNE_ROOM': {
				next(action)

				const state = getState()

				const nodesToDelete = selectAllPositions(state.room)
					.filter(x => [ConnectionNodeType.masterClock, ConnectionNodeType.audioOutput, ConnectionNodeType.virtualKeyboard].includes(x.targetType) === false)
					.filter(position => {
						return selectConnectionsWithSourceOrTargetIds(state.room, [position.id]).count() === 0
					})
					.map(x => x.id)
					.toIndexedSeq()
					.toArray()

				dispatch(deleteThingsAny(nodesToDelete, NetworkActionType.SERVER_AND_BROADCASTER))
				return dispatch(deletePositions(nodesToDelete))
			}
			case 'SAVE_ROOM_TO_BROWSER': {
				next(action)

				const state = getState()

				const room = selectActiveRoom(state)

				const localSaves = getOrCreateLocalSavesStorage()

				try {
					setLocalSavesToLocalStorage({
						...localSaves,
						all: localSaves.all.set(uuid.v4(), createRoomSave(state, room)),
					})

					return dispatch(chatSystemMessage('Room saved!', 'success'))
				} catch (error) {
					if (error instanceof Error) {
						if (error.name === 'QuotaExceededError') {
							return dispatch(chatSystemMessage('Browser save storage is full! Delete some saves to make room.', 'warning'))
						}
					}
					logger.error(`failed to save room to browser: `, error)
					return dispatch(chatSystemMessage('Something went wrong! An error has been logged.', 'error'))
				}
			}
			case 'SAVE_ROOM_TO_FILE': {
				next(action)

				const state = getState()

				const room = selectActiveRoom(state)

				const roomSave = createRoomSave(state, room)

				downloadObjectAsJson(roomSave, `${roomSave.saveDateTime.substring(0, 10)}-${room}`.replace(/ /g, '_'))

				return
			}
			case 'DELETE_SAVED_ROOM': {
				next(action)

				const localSaves = getOrCreateLocalSavesStorage()

				try {
					setLocalSavesToLocalStorage({
						...localSaves,
						all: localSaves.all.delete(action.id),
					})
				} catch (error) {
					logger.error(`failed to delete saved room from browser: `, error)
					dispatch(chatSystemMessage('Something went wrong! An error has been logged.', 'error'))
				}

				return
			}
			// case 'UPDATE_POSITIONS': {
			// 	// Mainly to handle loading old saves with smaller sizes
			// 	// Not perfect
			// 	// TODO I think we're doing this in 2 places...
			// 	const foo: ReturnType<typeof updatePositions> = {
			// 		...action,
			// 		positions: Map(action.positions).map((position): IPosition => {
			// 			return {
			// 				...position,
			// 				width: Math.max(position.width, position.width),
			// 				height: Math.max(position.height, position.height),
			// 			}
			// 		}),
			// 	}

			// 	next(foo)

			// 	return
			// }
			case 'CONNECT_KEYBOARD_TO_NODE': {
				const nodeInfo = findNodeInfo(action.targetType)

				if (!nodeInfo.canHaveKeyboardConnectedToIt) return

				const state = getState()
				const localKeyboardId = selectLocalVirtualKeyboardId(state)

				if (
					doesConnectionBetweenNodesExist(
						state.room, localKeyboardId, 0, action.nodeId, 0)
				) return

				return dispatch(connectionsActions.add(new Connection(
					localKeyboardId,
					ConnectionNodeType.virtualKeyboard,
					action.nodeId,
					action.targetType,
					0,
					0,
				)))
			}
			default: return next(action)
		}
	}
}

function createRoomSave(state: IClientAppState, roomName: string): SavedRoom {
	return {
		connections: selectAllConnections(state.room),
		globalClock: selectGlobalClockState(state.room),
		positions: selectAllPositions(state.room),
		roomSettings: selectRoomSettings(state.room),
		shamuGraph: stripShamuGraphForSaving(selectShamuGraphState(state.room)),
		saveDateTime: new Date().toISOString(),
		saveClientVersion: selectClientInfo(state).clientVersion,
		saveServerVersion: selectClientInfo(state).serverVersion,
		room: roomName,
	} as const
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
	// TODO
	// eslint-disable-next-line unicorn/prefer-node-append
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
			return {
				all: Map<Id, SavedRoom>(localSaves.all).map((save): SavedRoom => {
					return {
						...save,
						saveDateTime: save.saveDateTime || '?',
						saveClientVersion: save.saveClientVersion || '?',
						saveServerVersion: save.saveServerVersion || '?',
						room: save.room || '?',
					}
				}),
			}
		}
	} catch (error) {
		logger.error('error caught while trying to parse localSavesJSON: ', error)
		logger.error('localSavesJSON: ', localSavesJSON)
		return makeInitialLocalSavesStorage()
	}
}

const makeInitialLocalSavesStorage = (): LocalSaves => ({
	all: Map(),
})

let _previousNotesForSourceId = Map<Id, MidiNotes>()

function scheduleNote(
	note: IMidiNote,
	sourceId: Id,
	state: IClientAppState,
	onOrOff: 'on' | 'off',
	getAllInstruments: GetAllInstruments,
	dispatch: Dispatch,
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
	} else if (previousNotes.includes(note)) {
		_previousNotesForSourceId = _previousNotesForSourceId.update(sourceId, x => x.remove(note))
	} else {
		return
	}

	// logger.log('[local-middleware.scheduleNote] note: ' + note + ' | onOrOff: ' + onOrOff)

	const directlyConnectedSequencerIds = selectDirectDownstreamSequencerIds(state.room, sourceId).toArray()

	const targetIds = selectConnectionsWithSourceIds(state.room, [sourceId].concat(directlyConnectedSequencerIds))
		.map(x => x.targetId)

	const fancy = selectOption(state, AppOptions.graphicsExtraAnimations)

	getAllInstruments().forEach(instrument => {
		if (targetIds.includes(instrument.id) === false) return

		if (onOrOff === 'on') {
			instrument.scheduleNote(note, 0, true, Set([sourceId]))
			if (fancy) dispatch(animationActions.trigger(instrument.id, note))
		} else {
			instrument.scheduleRelease(note, 0)
		}
	})
}

function playShortNote(
	note: IMidiNote, sourceId: Id, roomState: IClientRoomState,
	getAllInstruments: GetAllInstruments,
) {
	const targetIds = selectConnectionsWithSourceIds(roomState, [sourceId]).map(x => x.targetId)
	const {gate, rate, pitch} = selectSequencer(roomState, sourceId)
	const bpm = selectGlobalClockState(roomState).bpm

	// Limit note length to 0.25 seconds
	const delayUntilRelease = Math.min(0.25, (60 / bpm) * rate * gate)

	const actualNote = note + pitch

	getAllInstruments().forEach(instrument => {
		if (targetIds.includes(instrument.id) === false) return

		instrument.scheduleNote(actualNote, 0, true, Set([sourceId]))

		instrument.scheduleRelease(actualNote, delayUntilRelease)
	})
}

function playShortNoteOnTarget(
	note: IMidiNote, targetId: Id, roomState: IClientRoomState,
	getAllInstruments: GetAllInstruments,
) {
	const delayUntilRelease = 0.25

	const instrument = getAllInstruments().get(targetId)

	if (!instrument) return

	instrument.scheduleNote(note, 0, true, Set([]))

	instrument.scheduleRelease(note, delayUntilRelease)
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

	if (localClient.id.startsWith('fake')) {
		logger.warn('FAKE')
		return
	}

	dispatch(pointersActions.add(localClient.id))

	// Don't do anything else if only room owner can do stuff
	const roomSettings = selectRoomSettings(state.room)
	if (roomSettings.onlyOwnerCanDoStuff && selectLocalClientId(state) !== roomSettings.ownerId) return

	const extremes = selectPositionExtremes(state.room)

	const y = 128 + 32 + 44

	const newVirtualKeyboard = new VirtualKeyboardState(localClient.id, localClient.color)
	dispatch(addVirtualKeyboard(newVirtualKeyboard))
	const keyboardPosition = makePosition({
		...newVirtualKeyboard,
		id: newVirtualKeyboard.id,
		targetType: ConnectionNodeType.virtualKeyboard,
		x: -556 + 150 - ((64 * 6) / 2),
		y: extremes.bottomMost + y,
		width: getNodeInfo().virtualKeyboard.defaultWidth,
		height: getNodeInfo().virtualKeyboard.defaultHeight,
	})
	dispatch(addPosition({
		...keyboardPosition,
		y: keyboardPosition.y - (keyboardPosition.height / 2),
	}))

	const nextPosition = {
		x: 174 - ((64 * 6) / 2),
		y: extremes.bottomMost + y,
	}

	const newInstrument = new BasicSynthesizerState(localClient.id)
	dispatch(addBasicSynthesizer(newInstrument))
	const instrumentPosition = makePosition({
		...newInstrument,
		id: newInstrument.id,
		targetType: ConnectionNodeType.basicSynthesizer,
		color: CssColor.blue,
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
		0,
		0,
	)))

	// Target to audio output
	dispatch(connectionsActions.add(new Connection(
		newInstrument.id,
		ConnectionNodeType.basicSynthesizer,
		MASTER_AUDIO_OUTPUT_TARGET_ID,
		ConnectionNodeType.audioOutput,
		0,
		0,
	)))
}

function _getDownstreamRecordingSequencers(
	state: IClientAppState, nodeId: Id
): List<ISequencerState> {
	return selectDirectDownstreamSequencerIds(state.room, nodeId)
		.map(x => selectSequencer(state.room, x))
		.filter(x => x.isRecording)
}
