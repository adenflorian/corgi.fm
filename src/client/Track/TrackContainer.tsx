import * as React from 'react'
import {connect} from 'react-redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {selectTrack} from '../../common/redux/tracks-redux'
import {Track} from './Track'
import './Track.less'

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

const mapStateToProps = (state: IClientAppState, props: IConnectedTrackContainerProps) => {
	const track = selectTrack(state.room, props.id)

	return {
		isPlaying: track.isPlaying,
		color: track.color,
		name: track.name,
	}
}

export const ConnectedTrackContainer = connect(
	mapStateToProps,
)(TrackContainer)
