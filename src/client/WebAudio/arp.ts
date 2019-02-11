import {emptyMidiNotes, IMidiNotes, MidiNotes} from '../../common/MidiNote'

export type OnNewNotes = (newNotes: IMidiNotes) => void

export class Arp {
	private readonly _rate = 1
	private readonly _shouldReTrigger = false
	private _notes = emptyMidiNotes
	private _startTime = 0

	public setNotes(notes: IMidiNotes) {
		this._notes = notes
		if (this._shouldReTrigger) {
			this._setStartTime()
		}
	}

	public start(onNewNotes: OnNewNotes) {
		this._onNewNotes = onNewNotes
		this._setStartTime()
		requestAnimationFrame(this._loop)
	}

	public dispose = () => undefined
	private _onNewNotes: OnNewNotes = () => undefined

	private readonly _setStartTime = () => {
		this._startTime = performance.now()
	}

	private readonly _loop = (timestamp: number) => {
		const newNotes = arp(this._notes, this._rate, this._startTime, timestamp)
		this._onNewNotes(newNotes)

		requestAnimationFrame(this._loop)
	}
}

function arp(midiNotes: IMidiNotes, rate: number, startTime: number, currentTime: number): IMidiNotes {
	const length = midiNotes.count()

	if (length === 0) return emptyMidiNotes
	if (length === 1) return midiNotes

	const timeElapsedSeconds: number = Number.parseInt(((currentTime - startTime) / 1000 / (1 / rate)).toFixed(0), 10)

	return MidiNotes([midiNotes.get(timeElapsedSeconds % length) || -1])
}
