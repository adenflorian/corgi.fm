import {saveAs} from 'file-saver'
import * as MidiWriter from 'midi-writer-js'
import {Dispatch, Middleware, MiddlewareAPI} from 'redux'
import {IClientAppState} from './common-redux-types'
import {
	EXPORT_SEQUENCER_MIDI, ExportSequencerMidiAction, selectAllGridSequencers, selectAllSequencers,
} from './grid-sequencers-redux'

export const createGridSequencerPlayerMiddleware = () => {

	const gridSequencerPlayerMiddleware: Middleware<{}, IClientAppState> = store => next => action => {
		next(action)

		switch (action.type) {
			case EXPORT_SEQUENCER_MIDI:
				return exportSequencerMidi(action, next, store)
		}
	}

	return gridSequencerPlayerMiddleware
}

function exportSequencerMidi(
	action: ExportSequencerMidiAction, next: Dispatch, store: MiddlewareAPI<Dispatch, IClientAppState>,
) {
	const roomState = store.getState().room

	const sequencer = selectAllSequencers(roomState)[action.sequencerId]

	const events = sequencer.events

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

	saveAs(write.dataUri(), sequencer.name + '.mid')
}
