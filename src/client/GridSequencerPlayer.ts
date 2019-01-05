import {IMidiNote} from '../common/MidiNote'

export enum SimpleGridSequencerEventAction {
	playNote,
	stopNote,
	endGridSequencer,
}

export interface ISimpleGridSequencerEvent {
	time: number
	action: SimpleGridSequencerEventAction
	notes?: IMidiNote[]
}

export type IndexChangeHandler = (newIndex: number) => any

export class GridSequencerPlayer {
	private readonly _audioContext: AudioContext
	private _index: number = 0
	private _startTime: number
	private _isPlaying: boolean = false
	private readonly _onIndexChange: IndexChangeHandler
	private _gridSequencerLength = 0

	constructor(audioContext: AudioContext, onIndexChange: IndexChangeHandler) {
		this._audioContext = audioContext
		this._onIndexChange = onIndexChange
		this._startTime = this._audioContext.currentTime
	}

	public play = (gridSequencerLength: number) => {
		if (this.isPlaying()) return
		this._startTime = this._audioContext.currentTime
		this._isPlaying = true
		this._gridSequencerLength = gridSequencerLength
		window.requestAnimationFrame(this._onTick)
	}

	public stop = () => {
		this._isPlaying = false
		this._index = 0
		this._onIndexChange(-1)
	}

	public getCurrentPlayTime = () => this._audioContext.currentTime - this._startTime

	public isPlaying = () => this._isPlaying

	private readonly _onTick = () => {
		this._doTick()

		if (this._isPlaying) {
			window.requestAnimationFrame(this._onTick)
		}
	}

	private _doTick = () => {
		const newIndex = Math.floor(this.getCurrentPlayTime() * 5)

		if (newIndex !== this._index) {
			if (newIndex >= this._gridSequencerLength) {
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
