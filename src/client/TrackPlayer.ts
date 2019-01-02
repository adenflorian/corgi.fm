import {IMidiNote} from '../common/MidiNote'

export enum SimpleTrackEventAction {
	playNote,
	stopNote,
	endTrack,
}

export interface ISimpleTrackEvent {
	time: number
	action: SimpleTrackEventAction
	notes?: IMidiNote[]
}

export type IndexChangeHandler = (newIndex: number) => any

export class TrackPlayer {
	private readonly _audioContext: AudioContext
	private _index: number = 0
	private _startTime: number
	private _isPlaying: boolean = false
	private readonly _onIndexChange: IndexChangeHandler
	private _trackLength = 0

	constructor(audioContext: AudioContext, onIndexChange: IndexChangeHandler) {
		this._audioContext = audioContext
		this._onIndexChange = onIndexChange
		this._startTime = this._audioContext.currentTime
	}

	public play = (trackLength: number) => {
		if (this.isPlaying()) return
		this._startTime = this._audioContext.currentTime
		this._isPlaying = true
		this._trackLength = trackLength
		window.requestAnimationFrame(this._onTick)
	}

	public stop = () => {
		this._isPlaying = false
		this._index = 0
		this._onIndexChange(-1)
	}

	public getCurrentPlayTime() {
		return this._audioContext.currentTime - this._startTime
	}

	public isPlaying(): boolean {
		return this._isPlaying
	}

	private readonly _onTick = () => {
		this._doTick()

		if (this._isPlaying) {
			window.requestAnimationFrame(this._onTick)
		}
	}

	private _doTick() {
		const newIndex = Math.floor(this.getCurrentPlayTime() * 5)

		if (newIndex !== this._index) {
			if (newIndex >= this._trackLength) {
				this._index = 0
				this._startTime = this._audioContext.currentTime
			} else {
				this._index = newIndex
			}
			if (this._isPlaying) {
				this._onIndexChange(this._index)
			}
		}
	}
}
