import * as React from 'react'
import ReactDOM from 'react-dom'
import {IMidiNote} from '../../common/MidiNote'

interface Props {
	stuff: string
}

const SchedulerVisual = function SchedulerVisual_({stuff}: Props) {
	return <div>{stuff}</div>
}

export function renderSchedulerVisual(note: IMidiNote, id: string) {
	ReactDOM.render(
		<SchedulerVisual stuff={note.toString()} />,
		document.getElementById('scheduleVisual-' + id),
	)
}
