import {saveAs} from 'file-saver'
import * as MidiWriter from 'midi-writer-js'
import {Dispatch, Middleware, MiddlewareAPI} from 'redux'
import {
	EXPORT_SEQUENCER_MIDI, IClientAppState, isEmptyEvents,
	selectAllSequencers, selectConnectionsWithSourceIds,
	SequencerAction, sequencerActions, STOP_SEQUENCER,
} from '../common/redux'
import {getAllInstruments} from './instrument-manager'

export const createSequencerMiddleware = () => {

	const sequencerMiddleware: Middleware<{}, IClientAppState> =
		store => next => (action: SequencerAction) => {
			next(action)

			switch (action.type) {
				case EXPORT_SEQUENCER_MIDI:
					return exportSequencerMidi(action, store)
				case STOP_SEQUENCER:
					return handleStopSequencer(action, store)
			}
		}

	return sequencerMiddleware
}

function exportSequencerMidi(
	action: ReturnType<typeof sequencerActions.exportMidi>,
	store: MiddlewareAPI<Dispatch, IClientAppState>,
) {
	const roomState = store.getState().room

	const sequencer = selectAllSequencers(roomState)[action.sequencerId]

	const events = sequencer.midiClip.events

	if (events.count() === 0) return
	if (isEmptyEvents(events)) return

	const midiSequencer = new MidiWriter.Track()

	const duration = '8'

	let nextWait = '0'

	const eventsToMidi = events.map(event => {
		const x = new MidiWriter.NoteEvent({
			pitch: event.notes.toArray(),
			duration,
			wait: nextWait,
		})

		nextWait = event.notes.count() === 0 ? duration : '0'

		return x
	})

	midiSequencer.setTempo(120)

	midiSequencer.addEvent(
		eventsToMidi,
		// () => ({sequential: true}),
	)

	const write = new MidiWriter.Writer([midiSequencer])

	saveAs(write.dataUri(), sequencer.name + '.mid')
}

function handleStopSequencer(
	action: ReturnType<typeof sequencerActions.stop>,
	store: MiddlewareAPI<Dispatch, IClientAppState>,
) {
	const instruments = getAllInstruments()

	selectConnectionsWithSourceIds(store.getState().room, [action.id])
		.map(x => instruments.get(x.targetId))
		.filter(x => x !== undefined)
		.forEach(x => x!.releaseAllScheduledFromSourceId(action.id))
}
