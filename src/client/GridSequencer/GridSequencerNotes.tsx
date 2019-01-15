import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {selectGlobalClockState} from '../../common/redux/global-clock-redux'
import {
	GridSequencerFields, selectAllGridSequencers, setGridSequencerField, setGridSequencerNote,
} from '../../common/redux/grid-sequencers-redux'
import {ISequencerEvent} from '../../common/redux/sequencer-redux'
import {MAX_MIDI_NOTE_NUMBER_127, MIN_MIDI_NOTE_NUMBER_0} from '../../common/server-constants'
import {isWhiteKey} from '../Keyboard/Keyboard'
import {VerticalScrollBar} from '../Knob/VerticalScrollBar'
import {isLeftMouseButtonDown} from '../utils'

type gridSequencerEventHandler = (index: number, isEnabled: boolean, i2: number, e: React.MouseEvent) => void

interface IGridSequencerNotesProps {
	id: string
}

interface IGridSequencerNotesReduxProps {
	events: ISequencerEvent[]
	activeIndex: number
	bottomNote: number
	notesToShow: number
}

interface IGridSequencerNotesDispatchProps {
	handleNoteClicked: gridSequencerEventHandler
	handleMouseEnter: gridSequencerEventHandler
	handleMouseDown: gridSequencerEventHandler
	handleScrollChange: (newValue: number) => void
}

type IGridSequencerNotesAllProps =
	IGridSequencerNotesProps & IGridSequencerNotesReduxProps & IGridSequencerNotesDispatchProps

export const GridSequencerNotes = (props: IGridSequencerNotesAllProps) => {
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

const mapStateToProps = (state: IClientAppState, props: IGridSequencerNotesProps): IGridSequencerNotesReduxProps => {
	const gridSequencerState = selectAllGridSequencers(state.room)[props.id]

	return {
		events: gridSequencerState.events,
		activeIndex: gridSequencerState.isPlaying
			? selectGlobalClockState(state.room).index % gridSequencerState.events.length
			: -1,
		bottomNote: gridSequencerState.scrollY,
		notesToShow: gridSequencerState.notesToShow,
	}
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: IGridSequencerNotesProps): IGridSequencerNotesDispatchProps => ({
	handleNoteClicked: (index, isEnabled, noteNumber) => {
		dispatch(setGridSequencerNote(id, index, !isEnabled, noteNumber))
	},
	handleMouseEnter: (index, isEnabled, noteNumber, e) => {
		if (e.ctrlKey && isEnabled === true && isLeftMouseButtonDown(e.buttons)) {
			dispatch(setGridSequencerNote(id, index, false, noteNumber))
		}
	},
	handleMouseDown: (index, isEnabled, noteNumber, e) => {
		if (e.ctrlKey && isEnabled === true && isLeftMouseButtonDown(e.buttons)) {
			dispatch(setGridSequencerNote(id, index, false, noteNumber))
		}
	},
	handleScrollChange: newValue => {
		dispatch(setGridSequencerField(id, GridSequencerFields.scrollY, Math.round(newValue)))
	},
})

export const GridSequencerNotesConnected = connect(
	mapStateToProps,
	mapDispatchToProps,
)(GridSequencerNotes)
