import {saveAs} from 'file-saver'
import * as MidiWriter from 'midi-writer-js'
import {AnyAction, Dispatch, Middleware, MiddlewareAPI} from 'redux'
import {GridSequencerPlayer} from '../../client/GridSequencerPlayer'
import {IClientAppState} from './common-redux-types'
import {addComplexObject, selectComplexObjectById} from './complex-objects-redux'
import {
	EXPORT_GRID_SEQUENCER_MIDI, ExportGridSequencerMidiAction, IGridSequencers,
	selectGridSequencer, selectGridSequencerEvents, setGridSequencerIndex, UPDATE_GRID_SEQUENCERS,
} from './grid-sequencers-redux'
import {BROADCASTER_ACTION, SERVER_ACTION} from './redux-utils'

export const PLAY_GRID_SEQUENCER = 'PLAY_GRID_SEQUENCER'
export const playGridSequencer = (id: string) => ({
	type: PLAY_GRID_SEQUENCER,
	id,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const STOP_GRID_SEQUENCER = 'STOP_GRID_SEQUENCER'
export const stopGridSequencer = (id: string) => ({
	type: STOP_GRID_SEQUENCER,
	id,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const RESTART_GRID_SEQUENCER = 'RESTART_GRID_SEQUENCER'
export const restartGridSequencer = (id: string) => ({
	type: RESTART_GRID_SEQUENCER,
	id,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const createGridSequencerPlayerMiddleware = (audioContext: AudioContext) => {

	const gridSequencerPlayerMiddleware: Middleware<{}, IClientAppState> = store => next => action => {
		switch (action.type) {
			case PLAY_GRID_SEQUENCER:
			case STOP_GRID_SEQUENCER:
			case RESTART_GRID_SEQUENCER:
			case UPDATE_GRID_SEQUENCERS:
				let gridSequencerPlayer = selectComplexObjectById(store.getState(), action.id)

				if (gridSequencerPlayer === undefined) {
					gridSequencerPlayer = new GridSequencerPlayer(
						audioContext,
						index => store.dispatch(setGridSequencerIndex(action.id, index)),
					)
					store.dispatch(
						addComplexObject(action.id, gridSequencerPlayer),
					)
				}

				return handleAction(action, gridSequencerPlayer, next, store)
			case EXPORT_GRID_SEQUENCER_MIDI:
				return exportGridSequencerMidi(action, next, store)
			default:
				return next(action)
		}
	}

	return gridSequencerPlayerMiddleware
}

function handleAction(
	action: AnyAction,
	gridSequencerPlayer: GridSequencerPlayer,
	next: Dispatch,
	store: MiddlewareAPI<Dispatch, IClientAppState>,
) {
	switch (action.type) {
		case PLAY_GRID_SEQUENCER:
			gridSequencerPlayer.play(selectGridSequencer(store.getState().room, action.id).events.length)
			return next(action)
		case STOP_GRID_SEQUENCER:
			gridSequencerPlayer.stop()
			return next(action)
		case RESTART_GRID_SEQUENCER:
			if (gridSequencerPlayer.isPlaying()) {
				gridSequencerPlayer.stop()
				gridSequencerPlayer.play(selectGridSequencer(store.getState().room, action.id).events.length)
			}
			return next(action)
		case UPDATE_GRID_SEQUENCERS:
			next(action)
			const gridSequencers: IGridSequencers = action.gridSequencers
			Object.keys(gridSequencers).forEach(gridSequencerId => {
				const gridSequencer = gridSequencers[gridSequencerId]
				if (gridSequencer.isPlaying) {
					store.dispatch(playGridSequencer(gridSequencer.id))
				}
			})
			return
		// case REFRESH_GRID_SEQUENCER_PLAYER_EVENTS:
		// 	next(action)
		// 	gridSequencerPlayer.setEvents(selectGridSequencer(store.getState(), action.id).notes.length)
		// 	return
		default:
			throw new Error('invalid gridSequencer player action type')
	}
}

// function notesToEvents(events: IGridSequencerEvent[]): ISimpleGridSequencerEvent[] {
// 	return events.reduce((newEvents, event, index) => {
// 		newEvents.push({
// 			time: index / 5,
// 			action: SimpleGridSequencerEventAction.playNote,
// 			notes: event.notes,
// 		})
// 		newEvents.push({
// 			time: (index / 5) + (1 / 5),
// 			action: SimpleGridSequencerEventAction.stopNote,
// 			notes: event.notes,
// 		})
// 		return newEvents
// 	}, []).concat({time: events.length / 5, action: SimpleGridSequencerEventAction.endGridSequencer, notes: []})
// }

function exportGridSequencerMidi(
	action: ExportGridSequencerMidiAction, next: Dispatch, store: MiddlewareAPI<Dispatch, IClientAppState>,
) {
	const roomState = store.getState().room

	const events = selectGridSequencerEvents(roomState, action.gridSequencerId)

	const midiGridSequencer = new MidiWriter.Track()

	const duration = '8'

	let nextWait = '0'

	const eventsToMidi = events.map(event => {
		const x = new MidiWriter.NoteEvent({
			pitch: event.notes,
			duration,
			wait: nextWait,
		})

		nextWait = event.notes.length === 0 ? duration : '0'

		return x
	})

	midiGridSequencer.setTempo(120)

	midiGridSequencer.addEvent(
		eventsToMidi,
		// () => ({sequential: true}),
	)

	const write = new MidiWriter.Writer([midiGridSequencer])

	saveAs(write.dataUri(), selectGridSequencer(roomState, action.gridSequencerId).name + '.mid')

	return next(action)
}
