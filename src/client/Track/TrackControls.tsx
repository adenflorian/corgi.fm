import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IAppState} from '../../common/redux/configureStore'
import {playTrack, restartTrack, stopTrack} from '../../common/redux/track-player-middleware'

interface ITrackControlsProps {
	handlePlayButtonClicked: () => void
	handleStopButtonClicked: () => void
	handleRestartButtonClicked: () => void
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
		</div>
	)
}

interface ITrackControlsConnectedProps {
	id: string
}

const mapSateToProps = (state: IAppState, props: ITrackControlsConnectedProps) => {
	// const trackState = selectTrack(state, props.id)

	return {
	}
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: ITrackControlsConnectedProps) => ({
	handlePlayButtonClicked: () => dispatch(playTrack(id)),
	handleStopButtonClicked: () => dispatch(stopTrack(id)),
	handleRestartButtonClicked: () => dispatch(restartTrack(id)),
})

export const TrackControlsConnected = connect(
	mapSateToProps,
	mapDispatchToProps,
)(TrackControls)
