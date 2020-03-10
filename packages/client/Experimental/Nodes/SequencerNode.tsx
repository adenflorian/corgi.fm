import React from 'react'
import * as uuid from 'uuid'
import * as Immutable from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {MidiRange} from '@corgifm/common/midi-types'
import {midiActions, NoteNameSharps} from '@corgifm/common/common-types'
import {logger} from '../../client-logger'
import {
	ExpCustomNumberParam, ExpCustomNumberParams, ExpMidiClipParams,
	ExpMidiClipParam, ExpButtons, ExpButton,
} from '../ExpParams'
import {ExpMidiOutputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpPorts} from '../ExpPorts'
import {ExpSequencerNodeExtra} from './ExpSequencerNodeView'
import {SeqPatternView, SeqPattern, SeqEvent, SeqNoteEvent, seqPatternViewReader, SeqReadEvent, SeqSession, SeqSessionClip} from './SeqStuff'
import {noteNameToMidi, midiNoteFromNoteName} from '@corgifm/common/common-samples-stuff'

export class SequencerNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customNumberParams: ExpCustomNumberParams
	protected readonly _buttons: ExpButtons
	private readonly _restartButton: ExpButton
	private readonly _tempo: ExpCustomNumberParam
	private readonly _midiOutputPort: ExpMidiOutputPort
	private _songStartTimeSeconds = -1
	private _cursorBeats = 0
	private _cursorSeconds = 0
	private readonly _session: SeqSession

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Sequencer', color: CssColor.yellow})

		const eventsA: readonly SeqNoteEvent[] = [
			makeNoteEvent('A', 3, 0, 3),
			makeNoteEvent('B', 3, 3, 3),
			makeNoteEvent('C', 4, 6, 3),
			makeNoteEvent('B', 3, 9, 3),
		]

		const eventsB: readonly SeqNoteEvent[] = [
			makeNoteEvent('A', 3, 0, 3),
			makeNoteEvent('B', 3, 3, 3),
			makeNoteEvent('C', 4, 6, 3),
			makeNoteEvent('B', 3, 9, 3),
		]

		const patternA = {
			id: uuid.v4(),
			events: Immutable.Map<Id, SeqEvent>(arrayToESIdKeyMap(eventsA)),
			name: 'Pattern A',
		}

		const patternB = {
			id: uuid.v4(),
			events: Immutable.Map<Id, SeqEvent>(arrayToESIdKeyMap(eventsB)),
			name: 'Pattern B',
		}

		const patternViewA = {
			id: uuid.v4(),
			startBeat: 0,
			endBeat: 12,
			loopStartBeat: 0,
			loopEndBeat: 12,
			pattern: patternA,
			name: 'Pattern View A',
		}

		const patternViewB = {
			id: uuid.v4(),
			startBeat: 0,
			endBeat: 12,
			loopStartBeat: 0,
			loopEndBeat: 12,
			pattern: patternB,
			name: 'Pattern View B',
		}

		const sessionClipA: SeqSessionClip = {
			id: uuid.v4(),
			active: true,
			channelId: uuid.v4(),
			sceneId: uuid.v4(),
			launchMode: 'trigger',
			patternView: patternViewA,
			name: 'Session Clip A',
		}

		const sessionClipB: SeqSessionClip = {
			id: uuid.v4(),
			active: true,
			channelId: uuid.v4(),
			sceneId: uuid.v4(),
			launchMode: 'trigger',
			patternView: patternViewB,
			name: 'Session Clip B',
		}

		this._session = {
			id: uuid.v4(),
			sessionClips: Immutable.Set([sessionClipA, sessionClipB]),
			name: 'The Session',
		}

		this._midiOutputPort = new ExpMidiOutputPort('output', 'output', this)
		this._ports = arrayToESIdKeyMap([this._midiOutputPort])

		this._tempo = new ExpCustomNumberParam('tempo', 240, 0.001, 999.99, 3)
		this._customNumberParams = arrayToESIdKeyMap([this._tempo])

		this._restartButton = new ExpButton('restart', this)
		this._buttons = arrayToESIdKeyMap([this._restartButton])

		this._restartButton.onPress.subscribe(this._onRestartPress)
	}

	public render = () => {
		return this.getDebugView()
	}

	protected _enable() {
	}

	protected _disable() {
		this._songStartTimeSeconds = -1
	}

	protected _dispose() {
	}

	private readonly _onRestartPress = () => {
		this._songStartTimeSeconds = -1
	}

	public onTick(currentGlobalTime: number, maxReadAheadSeconds: number) {
		super.onTick(currentGlobalTime, maxReadAheadSeconds)

		if (!this._enabled) return

		const currentAudioContextTime = currentGlobalTime

		if (this._songStartTimeSeconds < 0) {
			// this._songStartTimeSeconds = Math.ceil((currentGlobalTime + 0.1) * 10) / 10
			this._songStartTimeSeconds = currentAudioContextTime + 0.1
			// getAllAudioNodes().forEach(x => x.syncOscillatorStartTimes(songStartTimeSeconds, bpm))
			this._cursorSeconds = 0
			this._cursorBeats = 0
		}

		const startBeat = 0

		const actualBPM = Math.max(0.000001, this._tempo.value)
		const toBeats = (x: number) => x * (actualBPM / 60)
		const fromBeats = (x: number) => x * (60 / actualBPM)

		const currentSongTimeSeconds = currentAudioContextTime - this._songStartTimeSeconds
		const readToSongTimeSeconds = currentSongTimeSeconds + maxReadAheadSeconds
		const secondsToRead = readToSongTimeSeconds - this._cursorSeconds
		if (secondsToRead <= 0) return
		const readFromBeat = this._cursorBeats
		const beatsToRead = toBeats(secondsToRead)

		// distance from currentSongTime to where the cursor just started reading events from
		const offsetSeconds = this._cursorSeconds - currentSongTimeSeconds

		const readRangeBeats = new MidiRange(readFromBeat, beatsToRead)

		const events = seqPatternViewReader(readRangeBeats, this._session.sessionClips.first(undefined)!.patternView)

		if (events.length > 0) {
			const sortedEvents = events.slice().sort(sortEventByType).sort(sortEventByOffset)

			// if (sortedEvents.length > 4) console.log({events, sortedEvents})

			sortedEvents.forEach(event => {
				const eventStartSeconds = currentAudioContextTime + offsetSeconds + fromBeats(event.offsetBeats)
				// console.log(event)
				// console.log({eventStartSeconds})
				if (event.type === 'noteOn') {
					this._midiOutputPort.sendMidiAction(midiActions.note(eventStartSeconds, true, event.note, event.velocity))
				} else if (event.type === 'noteOff') {
					this._midiOutputPort.sendMidiAction(midiActions.note(eventStartSeconds, false, event.note, 0))
				}
			})
		}

		this._cursorSeconds = readToSongTimeSeconds
		this._cursorBeats += beatsToRead
	}
}

function sortEventByType(a: SeqReadEvent, b: SeqReadEvent): number {
	if (a.type === b.type) return 0

	return a.type === 'noteOff' ? -1 : 1
}

function sortEventByOffset(a: SeqReadEvent, b: SeqReadEvent): number {
	return a.offsetBeats - b.offsetBeats
}

function makeNoteEvent(noteName: NoteNameSharps, octave: Octave, startBeat: number, duration: number): SeqNoteEvent {
	return {
		id: uuid.v4(),
		active: true,
		startBeat,
		type: 'note',
		duration,
		velocity: 1,
		note: midiNoteFromNoteName(noteName, octave),
	}
}
