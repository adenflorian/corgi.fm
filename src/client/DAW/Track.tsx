import * as React from 'react'
import {Component} from 'react'
import {ITrack} from '../redux/daw-redux'
import './DAW.css'
import {Note} from './Note'

interface ITrackProps {
	track: ITrack
}

const noteLanes = Array.apply(null, Array(128)).map(Number.prototype.valueOf, 0)

// const trackLength = 10

export class Track extends Component<ITrackProps> {
	public render() {
		const {track} = this.props

		return (
			<div className="track">
				<div className="trackName">
					{track.name}
				</div>
				<div className="notes">
					<div className="notesScrollable">
						{noteLanes.map((_, index) => {
							return (
								<div key={index} className="noteLane">
									{track.notes.filter(note => note.note === index)
										.map(note => <Note key={note.start} note={note} />)
									}
								</div>
							)
						})}
					</div>
				</div>
			</div>
		)
	}
}
