import {List} from 'immutable'
import {logger} from '../common/logger'
import {ClientStore, ISequencerEvent, selectAllGridSequencers} from '../common/redux'
import {getInstruments} from './instrument-manager'
import {makeMidiClip, MidiClip, MidiClipEvents} from './note-scheduler'

let _store: ClientStore

export function startNoteScanner(store: ClientStore) {
	_store = store
	requestAnimationFrame(_foo)
}

function _foo(msSinceAppStart: number) {
	logger.log('im a loop: ', msSinceAppStart)

	const state = _store.getState()
	const sequencers = selectAllGridSequencers(state.room)
	const clips = Object.keys(sequencers)
		.map(x => sequencers[x])
		.filter(x => x.isPlaying)
		.map(x => x.events)
		.map(makeMidiClipFromGridSeqEvents)

	// schedule/play notes
	// need access to instruments from instrument-manager
	const instruments = getInstruments()

	clips.forEach(clip => {

	})

	requestAnimationFrame(_foo)
}

function makeMidiClipFromGridSeqEvents(events: List<ISequencerEvent>): MidiClip {
	return makeMidiClip({
		length: events.count(),
		loop: true,
		events: convertGridSeqEvents(events),
	})
}

function convertGridSeqEvents(events: List<ISequencerEvent>): MidiClipEvents {
	return events.map(convertGridSeqEvent).reduce((x, y) => x.concat(y))
}

function convertGridSeqEvent(event: ISequencerEvent): MidiClipEvents {
	return event.notes.map((x, i) => ({
		note: x,
		startBeat: i,
	})).toList()
}
