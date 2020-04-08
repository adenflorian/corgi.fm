import React from 'react'
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {MidiRange} from '@corgifm/common/midi-types'
import {midiActions} from '@corgifm/common/common-types'
import {
	ExpCustomNumberParam, ExpCustomNumberParams,
	ExpButtons, ExpButton, ExpCustomNumberParamReadonly,
	ExpReferenceParam, ExpReferenceParamReadonly, ExpReferenceParams,
} from '../../ExpParams'
import {ExpMidiOutputPort} from '../../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../../CorgiNode'
import {ExpPorts} from '../../ExpPorts'
import {ExpBetterSequencerNodeView} from './ExpBetterSequencerNodeView'
import {SeqReadEvent, seqPatternReader, seqPatternViewReader, SeqPatternView, makeSeqPatternView} from '@corgifm/common/SeqStuff'
import {makeExpMidiPatternViewState} from '@corgifm/common/redux'
import {minZoomX, maxZoomX, maxZoomY, minZoomY, maxPan, minPan} from '@corgifm/common/BetterConstants'
import {expBetterSequencerMainPatternParamId} from '@corgifm/common/common-constants'
import {logger} from '@corgifm/common/logger'

let bbb = 0

export class ExpBetterSequencerNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customNumberParams: ExpCustomNumberParams
	protected readonly _referenceParams: ExpReferenceParams
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
	private readonly _midiPatternViewParam: ExpReferenceParam<SeqPatternView>
	public get midiPatternParam() {return this._midiPatternViewParam as ExpReferenceParamReadonly<SeqPatternView>}

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Sequencer', color: CssColor.yellow})

		this._midiPatternViewParam = new ExpReferenceParam(
			expBetterSequencerMainPatternParamId, makeSeqPatternView() as SeqPatternView, 'midiPatternView')
		this._referenceParams = arrayToESIdKeyMap([this._midiPatternViewParam] as unknown as ExpReferenceParam[])

		this._midiOutputPort = new ExpMidiOutputPort('output', 'output', this)
		this._ports = arrayToESIdKeyMap([this._midiOutputPort])

		this._tempo = new ExpCustomNumberParam('tempo', 240, 0.001, 999.99, 3)
		this._rate = new ExpCustomNumberParam('rate', 1, 0.001, 4)
		this._zoomX = new ExpCustomNumberParam('zoomX', 1, minZoomX, maxZoomX)
		this._zoomY = new ExpCustomNumberParam('zoomY', 6, minZoomY, maxZoomY)
		this._panX = new ExpCustomNumberParam('panX', 1, minPan, maxPan)
		this._panY = new ExpCustomNumberParam('panY', 0.6, minPan, maxPan)
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
		if (Number.isNaN(beatsToRead)) return logger.error({beatsToRead, secondsToRead, readToSongTimeSeconds, cursorSeconds: this._cursorSeconds, currentSongTimeSeconds, actualBPM})

		// distance from currentSongTime to where the cursor just started reading events from
		const offsetSeconds = this._cursorSeconds - currentSongTimeSeconds

		const readRangeBeats = new MidiRange(readFromBeat, beatsToRead)

		const events = seqPatternViewReader(readRangeBeats, this._midiPatternViewParam.value.current)
		// const events = seqSessionReader(readRangeBeats, this._session)

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
