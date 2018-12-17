import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {ITrackEvent, selectTrack, setTrackBottomNote, setTrackNote} from '../../common/redux/tracks-redux'
import {MAX_MIDI_NOTE_NUMBER_127, MIN_MIDI_NOTE_NUMBER_0} from '../../common/server-constants'
import {isWhiteKey} from '../Keyboard/Keyboard'
import {VerticalScrollBar} from '../Knob/VerticalScrollBar'
import {isLeftMouseButtonDown} from '../utils'

type trackEventHandler = (index: number, isEnabled: boolean, i2: number, e: React.MouseEvent) => void

interface ITrackNotesProps {
	id: string
}

interface ITrackNotesReduxProps {
	events: ITrackEvent[]
	activeIndex: number
	bottomNote: number
	notesToShow: number
}

interface ITrackNotesDispatchProps {
	handleNoteClicked: trackEventHandler
	handleMouseEnter: trackEventHandler
	handleMouseDown: trackEventHandler
	handleScrollChange: (newValue: number) => void
}

type ITrackNotesAllProps = ITrackNotesProps & ITrackNotesReduxProps & ITrackNotesDispatchProps

export const TrackNotes = (props: ITrackNotesAllProps) => {
	const {activeIndex, bottomNote, events, handleNoteClicked,
		handleMouseEnter, handleMouseDown, notesToShow, handleScrollChange} = props

	const marks = events.reduce((allMarks, event) => {
		return allMarks.concat(event.notes.map(note => note / 127))
	}, new Array<number>())

	return (
		<div className="events">
			{events.map((event, index) => {
				const isActiveIndex = activeIndex === index
				return (
					<div
						key={index}
						className={`event ${isActiveIndex ? 'active' : 'transitionAllColor'}`}
					>
						{Array.apply(0, new Array(notesToShow)).map((_, i2) => {
							i2 += bottomNote
							const isEnabled = event.notes.some(x => x === i2)
							return (
								<div
									key={i2}
									className={`note ${isEnabled ? 'on' : ''} ${isWhiteKey(i2) ? 'white' : 'black'}`}
									onClick={e => handleNoteClicked(index, isEnabled, i2, e)}
									onMouseEnter={e => handleMouseEnter(index, isEnabled, i2, e)}
									onMouseDown={e => handleMouseDown(index, isEnabled, i2, e)}
								/>
							)
						})}
					</div>
				)
			})}
			<VerticalScrollBar
				min={MIN_MIDI_NOTE_NUMBER_0}
				max={MAX_MIDI_NOTE_NUMBER_127 - notesToShow}
				value={bottomNote}
				onChange={handleScrollChange}
				marks={marks}
				sliderGrabberHeightPercentage={notesToShow * 100 / MAX_MIDI_NOTE_NUMBER_127}
			/>
		</div>
	)
}

const mapSateToProps = (state: IClientAppState, props: ITrackNotesProps): ITrackNotesReduxProps => {
	const trackState = selectTrack(state.room, props.id)

	return {
		events: trackState.events,
		activeIndex: trackState.index,
		bottomNote: trackState.bottomNote,
		notesToShow: trackState.notesToShow,
	}
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: ITrackNotesProps): ITrackNotesDispatchProps => ({
	handleNoteClicked: (index, isEnabled, noteNumber) => {
		dispatch(setTrackNote(id, index, !isEnabled, noteNumber))
	},
	handleMouseEnter: (index, isEnabled, noteNumber, e) => {
		if (e.ctrlKey && isEnabled === true && isLeftMouseButtonDown(e.buttons)) {
			dispatch(setTrackNote(id, index, false, noteNumber))
		}
	},
	handleMouseDown: (index, isEnabled, noteNumber, e) => {
		if (e.ctrlKey && isEnabled === true && isLeftMouseButtonDown(e.buttons)) {
			dispatch(setTrackNote(id, index, false, noteNumber))
		}
	},
	handleScrollChange: newValue => {
		dispatch(setTrackBottomNote(id, Math.round(newValue)))
	},
})

export const TrackNotesConnected = connect(
	mapSateToProps,
	mapDispatchToProps,
)(TrackNotes)
