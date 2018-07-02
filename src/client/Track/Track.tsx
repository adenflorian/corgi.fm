import * as React from 'react'
import {TrackControlsConnected} from './TrackControls'
import {TrackNotesConnected} from './TrackNotes'

interface ITrackProps {
	color: string
	id: string
	isPlaying: boolean
	name: string
}

export const Track = (props: ITrackProps) => {
	const {id, color, isPlaying, name} = props

	return (
		<div
			className={`track ${isPlaying ? 'isPlaying saturate' : 'isNotPlaying'}`}
			style={{color}}
		>
			<div className="label transitionAllColor">{name}</div>
			<div id={id} className="container">
				<div className="isometricBoxShadow"></div>
				<TrackControlsConnected
					id={id}
				/>
				<TrackNotesConnected
					id={id}
				/>
			</div>
		</div>
	)
}
