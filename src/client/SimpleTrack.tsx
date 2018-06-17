import classnames from 'classnames'
import * as React from 'react'
import {Component} from 'react'
import {connect, Dispatch} from 'react-redux'
import {IMidiNote} from './MIDI/MidiNote'
import {IAppState} from './redux/configureStore'
import {
	ISimpleTrackNote,
	selectSimpleTrackIndex,
	selectSimpleTrackNotes,
	setSimpleTrackNote,
} from './redux/simple-track-redux'
import {playSimpleTrack, stopSimpleTrack} from './redux/track-player-middleware'
import './SimpleTrack.less'

interface ISimpleTrackProps {
	events: ISimpleTrackNote[]
	setNote: any
	play: any
	stop: any
	activeIndex: number
}

const arr128 = Array.apply(0, new Array(36))

export class SimpleTrack extends Component<ISimpleTrackProps> {
	public static defaultProps = {
		events: [
			{enabled: false, notes: []},
			{enabled: false, notes: []},
			{enabled: false, notes: []},
			{enabled: false, notes: []},
			{enabled: false, notes: []},
			{enabled: false, notes: []},
			{enabled: false, notes: []},
			{enabled: false, notes: []},
		],
	}

	public render() {
		const {events, setNote, play, stop, activeIndex} = this.props

		return (
			<div className="simpleTrack">
				<div>track</div>
				<div className="controls">
					<div
						className="play"
						onClick={play}
					>
						play
					</div>
					<div
						className="stop"
						onClick={stop}
					>
						stop
					</div>
				</div>
				<div className="events">
					{events.map((event, index) => {
						return (
							<div key={index} className={classnames(['event', activeIndex === index ? 'active' : ''])}>
								{arr128.map((_, i2) => {
									const isEnabled = event.notes.some(x => x === i2)
									return (
										<div
											key={i2}
											className={classnames([
												'note',
												isEnabled ? 'on' : '',
											])}
											onClick={() => setNote(index, !isEnabled, i2)}
										/>
									)
								})}
							</div>
						)
					})}
				</div>
			</div>
		)
	}
}

const mapStateToProps = (state: IAppState) => ({
	events: selectSimpleTrackNotes(state),
	activeIndex: selectSimpleTrackIndex(state),
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
	setNote: (index: number, enabled: boolean, note: IMidiNote) => dispatch(setSimpleTrackNote(index, enabled, note)),
	play: () => dispatch(playSimpleTrack()),
	stop: () => dispatch(stopSimpleTrack()),
})

export const ConnectedSimpleTrack = connect(
	mapStateToProps,
	mapDispatchToProps,
)(SimpleTrack)
