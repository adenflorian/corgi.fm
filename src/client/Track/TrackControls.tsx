import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IAppState} from '../../common/redux/configureStore'
import {playTrack, restartTrack, stopTrack} from '../../common/redux/track-player-middleware'
import {selectTrack, setTrackBottomNote} from '../../common/redux/tracks-redux'
import {Knob} from '../Volume/Knob'

interface ITrackControlsProps {
	bottomNote: number
	handlePlayButtonClicked: () => void
	handleStopButtonClicked: () => void
	handleRestartButtonClicked: () => void
	handleBottomNoteChanged: (e) => void
}

export const TrackControls = (props: ITrackControlsProps) => {
	return (
		<div className="controls unselectable">
			<div
				className="play colorTransition"
				onClick={props.handlePlayButtonClicked}
			>
				▶
			</div>
			<div
				className="stop colorTransition"
				onClick={props.handleStopButtonClicked}
			>
				◼
			</div>
			<div
				className="restart colorTransition"
				onClick={props.handleRestartButtonClicked}
			>
				↻
			</div>
			<div
				className="bottomNote colorTransition"
			>
				<Knob
					value={props.bottomNote}
					onChange={value => props.handleBottomNoteChanged(Math.floor(value))}
					min={0}
					max={84}
					sensitivity={0.1}
				/>
			</div>
		</div>
	)
}

interface ITrackControlsConnectedProps {
	id: string
}

const mapSateToProps = (state: IAppState, props: ITrackControlsConnectedProps) => {
	const trackState = selectTrack(state, props.id)

	return {
		bottomNote: trackState.bottomNote,
	}
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: ITrackControlsConnectedProps) => ({
	handlePlayButtonClicked: () => dispatch(playTrack(id)),
	handleStopButtonClicked: () => dispatch(stopTrack(id)),
	handleRestartButtonClicked: () => dispatch(restartTrack(id)),
	handleBottomNoteChanged: e => dispatch(setTrackBottomNote(id, e)),
})

export const TrackControlsConnected = connect(
	mapSateToProps,
	mapDispatchToProps,
)(TrackControls)
