import {IMidiNotes} from '../common/MidiNote'

export type OnNewNotes = (newNotes: IMidiNotes) => void

export class Arp {
	private _notes: IMidiNotes = []
	private _rate: number = 1
	private _startTime: number = 0
	private _shouldReTrigger: boolean = false

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

	private _setStartTime() {
		this._startTime = performance.now()
	}

	private _loop = (timestamp: number) => {
		const newNotes = arp(this._notes, this._rate, this._startTime, timestamp)
		this._onNewNotes(newNotes)

		requestAnimationFrame(this._loop)
	}
}

function arp(midiNotes: IMidiNotes, rate: number, startTime: number, currentTime: number) {
	const length = midiNotes.length

	if (length === 0) return []
	if (length === 1) return [...midiNotes]

	const timeElapsedSeconds: number = Number.parseInt(((currentTime - startTime) / 1000 / (1 / rate)).toFixed(0), 10)

	return [midiNotes[timeElapsedSeconds % length]]
}
