import {saveAs} from 'file-saver'
import * as MidiWriter from 'midi-writer-js'
import {Dispatch, Middleware, MiddlewareAPI} from 'redux'
import {IClientAppState} from './common-redux-types'
import {
	EXPORT_GRID_SEQUENCER_MIDI, ExportGridSequencerMidiAction, selectAllGridSequencers,
} from './grid-sequencers-redux'

export const createGridSequencerPlayerMiddleware = () => {

	const gridSequencerPlayerMiddleware: Middleware<{}, IClientAppState> = store => next => action => {
		next(action)

		switch (action.type) {
			case EXPORT_GRID_SEQUENCER_MIDI:
				return exportGridSequencerMidi(action, next, store)
		}
	}

	return gridSequencerPlayerMiddleware
}

function exportGridSequencerMidi(
	action: ExportGridSequencerMidiAction, next: Dispatch, store: MiddlewareAPI<Dispatch, IClientAppState>,
) {
	const roomState = store.getState().room

	const events = selectAllGridSequencers(roomState)[action.gridSequencerId].events

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

	saveAs(write.dataUri(), selectAllGridSequencers(roomState)[action.gridSequencerId].name + '.mid')
}
