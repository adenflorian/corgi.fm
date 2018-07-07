import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IAppState} from '../../common/redux/configureStore'
import {playTrack, restartTrack, stopTrack} from '../../common/redux/track-player-middleware'
import {selectTrack, setTrackBottomNote} from '../../common/redux/tracks-redux'
import {MAX_MIDI_NOTE_NUMBER_127, MIN_MIDI_NOTE_NUMBER_0} from '../../common/server-constants'
import {Knob} from '../Knob/Knob'

interface ITrackControlsProps {
	bottomNote: number
	handlePlayButtonClicked: () => void
	handleStopButtonClicked: () => void
	handleRestartButtonClicked: () => void
	handleBottomNoteChanged: (e) => void
	notesToShow: number
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
					min={MIN_MIDI_NOTE_NUMBER_0}
					max={MAX_MIDI_NOTE_NUMBER_127 - props.notesToShow}
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
		notesToShow: trackState.notesToShow,
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
