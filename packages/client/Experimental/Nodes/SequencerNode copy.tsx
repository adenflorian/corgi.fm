import React from 'react'
import {CssColor} from '@corgifm/common/shamu-color'
import {toBeats, fromBeats, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	preciseSubtract, preciseAdd, makeExpMidiClip,
	makeExpMidiEventsFromArray, ExpMidiClip, makeExpMidiNoteEvent,
	preciseRound, preciseCeil, convertExpMidiEventsToSequencerEvents,
} from '@corgifm/common/midi-types'
import {midiActions} from '@corgifm/common/common-types'
import {logger} from '../../client-logger'
import {
	ExpCustomNumberParam, ExpCustomNumberParams, ExpMidiClipParams,
	ExpMidiClipParam, ExpButtons, ExpButton,
} from '../ExpParams'
import {ExpMidiOutputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpPorts} from '../ExpPorts'
import {ExpSequencerNodeExtra} from './ExpSequencerNodeView'
import {EventStreamReader, myPrecision, songOfTime} from './EventStreamStuff'

let flag = false

export class SequencerNodeCopy extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customNumberParams: ExpCustomNumberParams
	protected readonly _midiClipParams: ExpMidiClipParams
	protected readonly _buttons: ExpButtons
	private readonly _restartButton: ExpButton
	private readonly _swapButton: ExpButton
	private readonly _tempo: ExpCustomNumberParam
	private _cursor = 0
	private readonly _eventStream = new EventStreamReader()
	private readonly _midiOutputPort: ExpMidiOutputPort
	private _startSongTime = -1
	private readonly _midiClip: ExpMidiClipParam

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Sequencer', color: CssColor.yellow})

		this._midiOutputPort = new ExpMidiOutputPort('output', 'output', this)
		this._ports = arrayToESIdKeyMap([this._midiOutputPort])

		this._tempo = new ExpCustomNumberParam('tempo', 240, 0.001, 999.99, 3)
		this._customNumberParams = arrayToESIdKeyMap([this._tempo])

		this._midiClip = new ExpMidiClipParam('midiClip', makeExpMidiClip(makeExpMidiEventsFromArray([
			makeExpMidiNoteEvent(0, 1, 60, 0.8),
			makeExpMidiNoteEvent(4, 2, 72, 1),
			makeExpMidiNoteEvent(2, 1, 65, 0.5),
		])))
		this._midiClipParams = arrayToESIdKeyMap([this._midiClip])

		this._restartButton = new ExpButton('restart', this)
		this._swapButton = new ExpButton('swap', this)
		this._buttons = arrayToESIdKeyMap([this._restartButton, this._swapButton])

		this._midiClip.value.subscribe(this._onMidiClipChange)
		this._restartButton.onPress.subscribe(this._onRestartPress)
		this._swapButton.onPress.subscribe(this._onSwapPress)
	}

	public render = () => {
		return this.getDebugView(
			<ExpSequencerNodeExtra
				eventStreamReader={this._eventStream}
			/>
		)
	}

	protected _enable() {
	}

	protected _disable() {
		this._midiOutputPort.sendMidiAction(midiActions.gate(this._startSongTime + this._cursor, false))
		this._startSongTime = -1
		this._cursor = 0
		this._eventStream.restart()
	}

	protected _dispose() {
		this._midiClip.value.unsubscribe(this._onMidiClipChange)
	}

	private readonly _onRestartPress = () => {
		this._midiOutputPort.sendMidiAction(midiActions.gate(this._startSongTime + this._cursor, false))
		this._startSongTime = -1
		this._cursor = 0
		this._eventStream.restart()
	}

	private readonly _onSwapPress = () => {
		if (flag) {
			this._eventStream.changeEvents(convertExpMidiEventsToSequencerEvents(this._midiClip.value.current.events))
		} else {
			this._eventStream.changeEvents(songOfTime)
		}
		flag = !flag
	}

	private readonly _onMidiClipChange = (clip: ExpMidiClip) => {

	}

	public onTick(currentGlobalTime: number, maxReadAhead: number) {
		super.onTick(currentGlobalTime, maxReadAhead)
		if (!this._enabled) return

		if (this._startSongTime < 0) {
			this._startSongTime = Math.ceil((currentGlobalTime + 0.1) * 10) / 10
		}

		const currentSongTime = preciseSubtract(currentGlobalTime, this._startSongTime)
		const targetSongTimeToReadTo = preciseCeil(preciseAdd(currentSongTime, maxReadAhead), myPrecision)
		const distanceSeconds = preciseRound(preciseSubtract(targetSongTimeToReadTo, this._cursor), myPrecision)

		if (distanceSeconds <= 0) return

		const distanceBeats = toBeats(distanceSeconds, this._tempo.value)
		const events = this._eventStream.read(distanceBeats)

		const songStartPlusCursor = preciseRound(this._startSongTime + this._cursor, myPrecision)

		events.forEach(event => {
			const eventDistanceSeconds = fromBeats(event.distanceFromMainCursor, this._tempo.value)
			const eventStart = preciseRound(songStartPlusCursor + eventDistanceSeconds, myPrecision)

			if (eventStart.toString().length > 8) logger.warn('precision error oh no: ', {eventDistanceFromCursor: event.distanceFromMainCursor, eventDistanceSeconds, songStartPlusCursor, eventStart})

			if (eventStart < 0) {
				logger.error('SequencerNode.onTick eventStart < 0:', {eventStart, eventDistanceSeconds, songStartPlusCursor, eventDistanceFromCursor: event.distanceFromMainCursor})
			} else {
				if (event.note) {
					this._midiOutputPort.sendMidiAction(midiActions.note(eventStart, event.gate, event.note, 1))
				} else {
					this._midiOutputPort.sendMidiAction(midiActions.gate(eventStart, event.gate))
				}
			}

			this.debugInfo.invokeNextFrame(JSON.stringify(event))
		})

		this._cursor = targetSongTimeToReadTo
	}
}
