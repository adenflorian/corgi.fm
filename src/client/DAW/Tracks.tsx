import * as React from 'react'
import {Component} from 'react'
import {ITrack} from '../../common/redux/daw-redux'
import {Track} from './Track'

interface ITracksProps {
	tracks: ITrack[]
}

export class Tracks extends Component<ITracksProps> {
	public render() {
		const {tracks} = this.props

		return (
			<div id="tracks">
				tracks
				{tracks.map(track => {
					return (
						<Track
							key={track.name}
							track={track}
						/>
					)
				})}
			</div>
		)
	}
}
