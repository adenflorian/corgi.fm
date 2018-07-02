import {Component} from 'react'
import * as React from 'react'
import {connect, Dispatch} from 'react-redux'
import {IAppState} from '../../common/redux/configureStore'
import {playTrack, restartTrack, stopTrack} from '../../common/redux/track-player-middleware'
import {ITrackEvent, selectTrack, setTrackNote} from '../../common/redux/tracks-redux'
import {isLeftMouseButtonDown} from '../utils'
import {Track} from './Track'
import './TrackView.less'

interface ITrackContainerProps {
	events: ITrackEvent[]
	activeIndex: number
	isPlaying: boolean
	color: string
	dispatch: Dispatch
	id: string
	name: string
}

export class TrackContainer extends Component<ITrackContainerProps> {
	public render() {
		const {id, color, events, activeIndex, isPlaying} = this.props

		return (
			<Track
				color={color}
				events={events}
				activeIndex={activeIndex}
				isPlaying={isPlaying}
				id={id}
				handlePlayButtonClicked={this.handlePlayButtonClicked}
				handleStopButtonClicked={this.handleStopButtonClicked}
				handleRestartButtonClicked={this.handleRestartButtonClicked}
				handleNoteClicked={this.handleNoteClicked}
				handleMouseEnter={this.handleMouseEnter}
				handleMouseDown={this.handleMouseDown}
			/>
		)
	}

	private handlePlayButtonClicked = () => {
		this.props.dispatch(playTrack(this.props.id))
	}

	private handleStopButtonClicked = () => {
		this.props.dispatch(stopTrack(this.props.id))
	}

	private handleRestartButtonClicked = () => {
		this.props.dispatch(restartTrack(this.props.id))
	}

	private handleNoteClicked = (index: number, isEnabled: boolean, noteNumber: number) => {
		this.props.dispatch(setTrackNote(this.props.id, index, !isEnabled, noteNumber))
	}

	private handleMouseEnter = (index: number, isEnabled: boolean, noteNumber: number, e) => {
		if (e.ctrlKey && isEnabled === true && isLeftMouseButtonDown(e.buttons)) {
			this.props.dispatch(setTrackNote(this.props.id, index, false, noteNumber))
		}
	}

	private handleMouseDown = (index: number, isEnabled: boolean, noteNumber: number, e) => {
		if (e.ctrlKey && isEnabled === true && isLeftMouseButtonDown(e.buttons)) {
			this.props.dispatch(setTrackNote(this.props.id, index, false, noteNumber))
		}
	}
}

interface IConnectedTrackContainerProps {
	id: string
}

const mapStateToProps = (state: IAppState, props: IConnectedTrackContainerProps) => {
	const track = selectTrack(state, props.id)
	return {
		events: track.notes,
		activeIndex: track.index,
		isPlaying: track.isPlaying,
		color: track.color,
		name: track.name,
	}
}

export const ConnectedTrackContainer = connect(
	mapStateToProps,
)(TrackContainer)
