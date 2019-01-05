import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {playTrack, restartTrack, stopTrack} from '../../common/redux/track-player-middleware'
import {exportTrackMidi} from '../../common/redux/tracks-redux'
import {isProdClient} from '../is-prod-client'

interface ITrackControlsProps {
	handlePlayButtonClicked: () => void
	handleStopButtonClicked: () => void
	handleRestartButtonClicked: () => void
	id: string
}

export const TrackControls = (props: ITrackControlsProps & {dispatch: Dispatch}) => {
	return (
		<div className="controls unselectable">
			<div
				className="play colorTransition"
				onClick={() => props.dispatch(playTrack(props.id))}
			>
				▶
			</div>
			<div
				className="stop colorTransition"
				onClick={() => props.dispatch(stopTrack(props.id))}
			>
				◼
			</div>
			<div
				className="restart colorTransition"
				onClick={() => props.dispatch(restartTrack(props.id))}
			>
				↻
			</div>
			{isProdClient() === false &&
				<div
					className="export colorTransition"
					onClick={() => props.dispatch(exportTrackMidi(props.id))}
				>
					⭳
				</div>
			}
		</div>
	)
}

export const TrackControlsConnected = connect()(TrackControls)
