import classnames from 'classnames'
import * as React from 'react'
import {Component} from 'react'
import {connect, Dispatch} from 'react-redux'
import {IAppState} from './redux/configureStore'
import {selectSimpleTrackIndex, selectSimpleTrackNotes, setSimpleTrackNote} from './redux/simple-track-redux'
import {playSimpleTrack, stopSimpleTrack} from './redux/track-player-middleware'
import './SimpleTrack.less'

interface ISimpleTrackProps {
	notes: boolean[]
	setNote: any
	play: any
	stop: any
	activeIndex: number
}

export class SimpleTrack extends Component<ISimpleTrackProps> {
	public static defaultProps = {
		notes: [false, false, false, false],
	}

	public render() {
		const {notes, setNote, play, stop, activeIndex} = this.props

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
				<div className="noteCells">
					{notes.map((note, index) => {
						return (
							<div
								key={index}
								className={classnames([
									'noteCell',
									note ? 'on' : '',
									activeIndex === index ? 'active' : '',
								])}
								onClick={() => setNote(index, !note)}
							/>
						)
					})}
				</div>
			</div>
		)
	}
}

const mapStateToProps = (state: IAppState) => ({
	notes: selectSimpleTrackNotes(state),
	activeIndex: selectSimpleTrackIndex(state),
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
	setNote: (index: number, enabled: boolean) => dispatch(setSimpleTrackNote(index, enabled)),
	play: () => dispatch(playSimpleTrack()),
	stop: () => dispatch(stopSimpleTrack()),
})

export const ConnectedSimpleTrack = connect(
	mapStateToProps,
	mapDispatchToProps,
)(SimpleTrack)
