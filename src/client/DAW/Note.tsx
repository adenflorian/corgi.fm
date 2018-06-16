import * as React from 'react'
import {Component} from 'react'
import {IDawNote} from '../redux/daw-redux'
import './DAW.less'

interface INoteProps {
	note: IDawNote
}

export class Note extends Component<INoteProps> {
	public render() {
		const {start, duration} = this.props.note

		return (
			<div
				className="note"
				style={{
					width: duration * 100,
					left: start * 100,
				}}
			>
				{/* {note.note} */}
			</div>
		)
	}
}
