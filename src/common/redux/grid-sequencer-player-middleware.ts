import {saveAs} from 'file-saver'
import * as MidiWriter from 'midi-writer-js'
import {Dispatch, Middleware, MiddlewareAPI} from 'redux'
import {IClientAppState} from './index'
import {
	EXPORT_SEQUENCER_MIDI, selectAllSequencers,
} from './index'
import {isEmptyEvents} from './index'
import {sequencerActions} from './sequencer-redux'

export const createSequencerMiddleware = () => {

	const sequencerMiddleware: Middleware<{}, IClientAppState> = store => next => action => {
		next(action)

		switch (action.type) {
			case EXPORT_SEQUENCER_MIDI:
				return exportSequencerMidi(action, store)
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
