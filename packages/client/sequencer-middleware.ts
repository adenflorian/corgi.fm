import {saveAs} from 'file-saver'
import * as MidiWriter from 'midi-writer-js'
import {Dispatch, Middleware, MiddlewareAPI} from 'redux'
import {
	IClientAppState, isEmptyEvents,
	selectConnectionsWithSourceIds,
	selectSequencer, SequencerAction, sequencerActions,
} from '@corgifm/common/redux'
import {GetAllInstruments} from './instrument-manager'

export const createSequencerMiddleware = (getAllInstruments: GetAllInstruments) => {

	const sequencerMiddleware: Middleware<{}, IClientAppState> =
		store => next => (action: SequencerAction) => {
			next(action)

			switch (action.type) {
				case 'EXPORT_SEQUENCER_MIDI':
					return exportSequencerMidi(action, store)
				case 'STOP_SEQUENCER':
					return handleStopSequencer(action, store, getAllInstruments)
			}
		}

	return sequencerMiddleware
}

function exportSequencerMidi(
	action: ReturnType<typeof sequencerActions.exportMidi>,
	store: MiddlewareAPI<Dispatch, IClientAppState>,
) {
	const roomState = store.getState().room

	const sequencer = selectSequencer(roomState, action.id)

	const events = sequencer.midiClip.events

	if (events.count() === 0) return
	if (isEmptyEvents(events)) return

	const midiSequencer = new MidiWriter.Track()

	// 8 for 8th note
	const duration = '8'

	let nextWait = '0'

	const eventsToMidi = events.map(event => {
		const x = new MidiWriter.NoteEvent({
			pitch: [event.note],
			duration,
			wait: nextWait,
		})

		nextWait = event.note === -1 ? duration : '0'

		return x
	}).toArray()

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
	getAllInstruments: GetAllInstruments,
) {
	const instruments = getAllInstruments()

	selectConnectionsWithSourceIds(store.getState().room, [action.id])
		.map(x => instruments.get(x.targetId))
		.filter(x => x !== undefined)
		.forEach(x => x!.releaseAllScheduledFromSourceId(action.id))
}
