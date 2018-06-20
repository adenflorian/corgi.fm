import classnames from 'classnames'
import * as React from 'react'
import {Component} from 'react'
import {connect, Dispatch} from 'react-redux'
import {IMidiNote} from '../common/MidiNote'
import {IAppState} from '../common/redux/configureStore'
import {
	ISimpleTrackNote,
	selectSimpleTrackEvents,
	selectSimpleTrackIndex,
	setSimpleTrackNote,
} from '../common/redux/simple-track-redux'
import {
	playSimpleTrack,
	refreshSimpleTrackPlayerEvents,
	restartSimpleTrack,
	stopSimpleTrack,
} from '../common/redux/track-player-middleware'
import {isWhiteKey} from './Keyboard/Keyboard'
import './SimpleTrack.less'

interface ISimpleTrackProps {
	events: ISimpleTrackNote[]
	setNote: any
	play: any
	stop: any
	restart: any
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
		const {events, setNote, play, stop, restart, activeIndex} = this.props

		return (
			<div className="simpleTrack">
				<div className="label">track-1</div>
				<div className="container">
					<div className="controls">
						<div
							className="play unselectable"
							onClick={play}
						>
							▶
					</div>
						<div
							className="stop unselectable"
							onClick={stop}
						>
							◼
					</div>
						<div
							className="restart unselectable"
							onClick={restart}
						>
							↻
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
													isWhiteKey(i2) ? 'white' : 'black',
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
			</div>
		)
	}
}

const mapStateToProps = (state: IAppState) => ({
	events: selectSimpleTrackEvents(state),
	activeIndex: selectSimpleTrackIndex(state),
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
	setNote: (index: number, enabled: boolean, note: IMidiNote) => {
		dispatch(setSimpleTrackNote(index, enabled, note))
		dispatch(refreshSimpleTrackPlayerEvents())
	},
	play: () => dispatch(playSimpleTrack()),
	stop: () => dispatch(stopSimpleTrack()),
	restart: () => dispatch(restartSimpleTrack()),
})

export const ConnectedSimpleTrack = connect(
	mapStateToProps,
	mapDispatchToProps,
)(SimpleTrack)
