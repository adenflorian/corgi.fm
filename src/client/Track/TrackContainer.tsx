import * as React from 'react'
import {connect} from 'react-redux'
import {IAppState} from '../../common/redux/configureStore'
import {selectTrack} from '../../common/redux/tracks-redux'
import {Track} from './Track'
import './TrackView.less'

interface ITrackContainerProps {
	isPlaying: boolean
	color: string
	id: string
	name: string
}

export const TrackContainer = (props: ITrackContainerProps) => {
	const {id, color, isPlaying, name} = props

	return (
		<Track
			color={color}
			isPlaying={isPlaying}
			id={id}
			name={name}
		/>
	)
}

interface IConnectedTrackContainerProps {
	id: string
}

const mapStateToProps = (state: IAppState, props: IConnectedTrackContainerProps) => {
	const track = selectTrack(state, props.id)

	return {
		isPlaying: track.isPlaying,
		color: track.color,
		name: track.name,
	}
}

export const ConnectedTrackContainer = connect(
	mapStateToProps,
)(TrackContainer)
