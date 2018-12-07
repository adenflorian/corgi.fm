import {IMidiNote} from '../common/MidiNote'

export class Arp {
	private _notes: IMidiNote[] = []
	private _rate: number = 1
	private _startTime: number
	private _onNewNotes: (newNotes: IMidiNote[]) => void
	private _shouldReTrigger: boolean = false

	public setNotes(notes) {
		this._notes = notes
		if (this._shouldReTrigger) {
			this._setStartTime()
		}
	}

	public start(onNewNotes) {
		this._onNewNotes = onNewNotes
		this._setStartTime()
		requestAnimationFrame(this._loop)
	}

	private _setStartTime() {
		this._startTime = performance.now()
	}

	private _loop = timestamp => {
		const newNotes = arp(this._notes, this._rate, this._startTime, timestamp)
		this._onNewNotes(newNotes)

		requestAnimationFrame(this._loop)
	}
}

function arp(midiNotes, rate, startTime, currentTime) {
	const length = midiNotes.length

	if (length === 0) return []
	if (length === 1) return [...midiNotes]

	const timeElapsedSeconds: number = Number.parseInt(((currentTime - startTime) / 1000 / (1 / rate)).toFixed(0))

	return [midiNotes[timeElapsedSeconds % length]]
}
