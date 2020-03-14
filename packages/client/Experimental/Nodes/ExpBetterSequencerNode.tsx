import React from 'react'
import * as uuid from 'uuid'
import * as Immutable from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {MidiRange} from '@corgifm/common/midi-types'
import {midiActions, NoteNameSharps, NoteNameFlats} from '@corgifm/common/common-types'
import {logger} from '../../client-logger'
import {
	ExpCustomNumberParam, ExpCustomNumberParams,
	ExpButtons, ExpButton, ExpCustomNumberParamReadonly, ExpMidiPatternParam, ExpMidiPatternParamReadonly,
} from '../ExpParams'
import {ExpMidiOutputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpPorts} from '../ExpPorts'
import {ExpBetterSequencerNodeView} from './ExpBetterSequencerNodeView'
import {SeqPatternView, SeqPattern, SeqEvent, SeqNoteEvent, seqPatternViewReader, SeqReadEvent, SeqSession, SeqSessionClip, seqSessionReader} from '@corgifm/common/SeqStuff'
import {noteNameToMidi, midiNoteFromNoteName} from '@corgifm/common/common-samples-stuff'
import {expMidiPatternsActions, makeExpMidiPatternState} from '@corgifm/common/redux'

export class ExpBetterSequencerNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customNumberParams: ExpCustomNumberParams
	protected readonly _buttons: ExpButtons
	private readonly _restartButton: ExpButton
	private readonly _tempo: ExpCustomNumberParam
	public get tempo() {return this._tempo as ExpCustomNumberParamReadonly}
	private readonly _rate: ExpCustomNumberParam
	public get rate() {return this._rate as ExpCustomNumberParamReadonly}
	private readonly _zoomX: ExpCustomNumberParam
	public get zoomX() {return this._zoomX as ExpCustomNumberParamReadonly}
	private readonly _zoomY: ExpCustomNumberParam
	public get zoomY() {return this._zoomY as ExpCustomNumberParamReadonly}
	private readonly _panX: ExpCustomNumberParam
	public get panX() {return this._panX as ExpCustomNumberParamReadonly}
	private readonly _panY: ExpCustomNumberParam
	public get panY() {return this._panY as ExpCustomNumberParamReadonly}
	private readonly _midiOutputPort: ExpMidiOutputPort
	private _songStartTimeSeconds = -1
	private _cursorBeats = 0
	private _cursorSeconds = 0
	private readonly _session: SeqSession
	private readonly _midiPatternParam: ExpMidiPatternParam
	public get midiPatternParam() {return this._midiPatternParam as ExpMidiPatternParamReadonly}

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Sequencer', color: CssColor.yellow})

		const {dispatch} = this.singletonContext.getStore()!

		const eventsA: readonly SeqNoteEvent[] = [
			makeNoteEvent('D', 3, 0, 3),
			makeNoteEvent('E', 3, 3, 3),
			makeNoteEvent('F', 3, 6, 3),
			makeNoteEvent('E', 3, 9, 3),

			makeNoteEvent('Bb', 3, 12, 3),
			makeNoteEvent('F', 3, 15, 3),
			makeNoteEvent('Bb', 3, 18, 3),
			makeNoteEvent('A', 3, 21, 3),

			makeNoteEvent('D', 3, 24, 3),
			makeNoteEvent('E', 3, 27, 3),
			makeNoteEvent('F', 3, 30, 3),
			makeNoteEvent('E', 3, 33, 3),

			makeNoteEvent('Bb', 3, 36, 3),
			makeNoteEvent('A', 3, 39, 3),

			makeNoteEvent('D', 3, 42, 3),
			makeNoteEvent('E', 3, 45, 3),
			makeNoteEvent('F', 3, 48, 3),
			makeNoteEvent('E', 3, 51, 3),

			makeNoteEvent('D', 3, 54, 3),
			makeNoteEvent('E', 3, 57, 3),
			makeNoteEvent('F', 3, 60, 3),
			makeNoteEvent('E', 3, 63, 3),
		]

		const eventsB: readonly SeqNoteEvent[] = [
			makeNoteEvent('A', 4, 1, 1),
			makeNoteEvent('A', 4, 2, 1),
			makeNoteEvent('B', 4, 4, 2),
			makeNoteEvent('C', 5, 7, 1),
			makeNoteEvent('C', 5, 8, 1),
			makeNoteEvent('B', 4, 10, 2),

			makeNoteEvent('A', 4, 13, 1),
			makeNoteEvent('A', 4, 14, 1),
			makeNoteEvent('A', 4, 16, 2),
			makeNoteEvent('A', 4, 19, 1),
			makeNoteEvent('A', 4, 20, 1),
			makeNoteEvent('A', 4, 22, 2),

			makeNoteEvent('A', 4, 25, 1),
			makeNoteEvent('A', 4, 26, 1),
			makeNoteEvent('B', 4, 28, 2),
			makeNoteEvent('C', 5, 31, 1),
			makeNoteEvent('C', 5, 32, 1),
			makeNoteEvent('B', 4, 34, 2),

			makeNoteEvent('A', 4, 37, 1),
			makeNoteEvent('A', 4, 38, 1),
			makeNoteEvent('A', 4, 40, 2),

			makeNoteEvent('A', 4, 43, 1),
			makeNoteEvent('A', 4, 44, 1),
			makeNoteEvent('B', 4, 46, 2),
			makeNoteEvent('C', 5, 49, 1),
			makeNoteEvent('C', 5, 50, 1),
			makeNoteEvent('B', 4, 52, 2),

			makeNoteEvent('A', 4, 55, 1),
			makeNoteEvent('A', 4, 56, 1),
			makeNoteEvent('B', 4, 58, 2),
			makeNoteEvent('C', 5, 61, 1),
			makeNoteEvent('C', 5, 62, 1),
			makeNoteEvent('B', 4, 64, 2),
		]



		const eventsC: readonly SeqNoteEvent[] = [
			makeNoteEvent('D', 5, 0, 0.5),
			makeNoteEvent('F', 5, 0.5, 0.5),
			makeNoteEvent('D', 6, 1, 2),
			makeNoteEvent('D', 5, 3, 0.5),
			makeNoteEvent('F', 5, 3.5, 0.5),
			makeNoteEvent('D', 6, 4, 2),

			makeNoteEvent('E', 6, 6, 1.5),
			makeNoteEvent('F', 6, 7.5, 0.5),
			makeNoteEvent('E', 6, 8, 0.5),
			makeNoteEvent('F', 6, 8.5, 0.5),
			makeNoteEvent('E', 6, 9, 0.5),
			makeNoteEvent('C', 6, 9.5, 0.5),
			makeNoteEvent('A', 5, 10, 2),

			makeNoteEvent('A', 5, 12, 1),
			makeNoteEvent('D', 5, 13, 1),
			makeNoteEvent('F', 5, 14, 0.5),
			makeNoteEvent('G', 5, 14.5, 0.5),
			makeNoteEvent('A', 5, 15, 3),

			makeNoteEvent('A', 5, 18, 1),
			makeNoteEvent('D', 5, 19, 1),
			makeNoteEvent('F', 5, 20, 0.5),
			makeNoteEvent('G', 5, 20.5, 0.5),
			makeNoteEvent('E', 5, 21, 3),
			

			makeNoteEvent('D', 5, 24, 0.5),
			makeNoteEvent('F', 5, 24.5, 0.5),
			makeNoteEvent('D', 6, 25, 2),
			makeNoteEvent('D', 5, 27, 0.5),
			makeNoteEvent('F', 5, 27.5, 0.5),
			makeNoteEvent('D', 6, 28, 2),

			makeNoteEvent('E', 6, 30, 1.5),
			makeNoteEvent('F', 6, 31.5, 0.5),
			makeNoteEvent('E', 6, 32, 0.5),
			makeNoteEvent('F', 6, 32.5, 0.5),
			makeNoteEvent('E', 6, 33, 0.5),
			makeNoteEvent('C', 6, 33.5, 0.5),
			makeNoteEvent('A', 5, 34, 2),

			makeNoteEvent('A', 5, 36, 1),
			makeNoteEvent('D', 5, 37, 1),
			makeNoteEvent('F', 5, 38, 0.5),
			makeNoteEvent('G', 5, 38.5, 0.5),
			makeNoteEvent('A', 5, 39, 3),

			makeNoteEvent('A', 5, 41, 1),
			makeNoteEvent('D', 5, 42, 3),
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

		const patternC = {
			id: uuid.v4(),
			events: Immutable.Map<Id, SeqEvent>(arrayToESIdKeyMap(eventsC)),
			name: 'Pattern C',
		}

		const patternViewA = {
			id: uuid.v4(),
			startBeat: 0,
			endBeat: 66,
			loopStartBeat: 0,
			loopEndBeat: 66,
			pattern: patternA,
			name: 'Pattern View A',
		}

		const patternViewB = {
			id: uuid.v4(),
			startBeat: 0,
			endBeat: 66,
			loopStartBeat: 0,
			loopEndBeat: 66,
			pattern: patternB,
			name: 'Pattern View B',
		}

		const patternViewC = {
			id: uuid.v4(),
			startBeat: 0,
			endBeat: 66,
			loopStartBeat: 0,
			loopEndBeat: 66,
			pattern: patternC,
			name: 'Pattern View C',
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

		const sessionClipC: SeqSessionClip = {
			id: uuid.v4(),
			active: true,
			channelId: uuid.v4(),
			sceneId: uuid.v4(),
			launchMode: 'trigger',
			patternView: patternViewC,
			name: 'Session Clip C',
		}

		this._session = {
			id: uuid.v4(),
			sessionClips: Immutable.Set([sessionClipA, sessionClipB, sessionClipC]),
			name: 'The Session',
		}

		const newPattern = makeExpMidiPatternState(patternA)

		dispatch(expMidiPatternsActions.add(newPattern))

		this._midiPatternParam = new ExpMidiPatternParam('main', newPattern)

		this._midiOutputPort = new ExpMidiOutputPort('output', 'output', this)
		this._ports = arrayToESIdKeyMap([this._midiOutputPort])

		this._tempo = new ExpCustomNumberParam('tempo', 240, 0.001, 999.99, 3)
		this._rate = new ExpCustomNumberParam('rate', 1, 0.001, 4)
		this._zoomX = new ExpCustomNumberParam('zoomX', 1, 0.5, 2)
		this._zoomY = new ExpCustomNumberParam('zoomY', 1, 0.5, 2)
		this._panX = new ExpCustomNumberParam('panX', 1, 0.5, 2)
		this._panY = new ExpCustomNumberParam('panY', 1, 0.5, 2)
		this._customNumberParams = arrayToESIdKeyMap([this._tempo, this._rate, this._zoomX, this._zoomY, this._panX, this._panY])

		this._restartButton = new ExpButton('restart', this)
		this._buttons = arrayToESIdKeyMap([this._restartButton])

		this._restartButton.onPress.subscribe(this._onRestartPress)
	}

	public render = () => {
		return this.getDebugView(
			<ExpBetterSequencerNodeView
				
			/>
		)
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

		const events = seqSessionReader(readRangeBeats, this._session)

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

function makeNoteEvent(noteName: NoteNameSharps | NoteNameFlats, octave: Octave, startBeat: number, duration: number): SeqNoteEvent {
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
