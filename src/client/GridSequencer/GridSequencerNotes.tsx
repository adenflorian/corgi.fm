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
import {getColorStringForMidiNote} from '../../common/shamu-color'
import {isWhiteKey} from '../Keyboard/Keyboard'
import {VerticalScrollBar} from '../Knob/VerticalScrollBar'
import {isLeftMouseButtonDown} from '../utils'

type GridSequencerEventHandler = (index: number, isEnabled: boolean, i2: number, e: React.MouseEvent) => void

type MouseEventHandler = (e: React.MouseEvent) => void

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
	handleNoteClicked: GridSequencerEventHandler
	handleMouseEnter: GridSequencerEventHandler
	handleMouseDown: GridSequencerEventHandler
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
			{events.map((event, eventIndex) => {
				return <Event
					notes={event.notes}
					eventIndex={eventIndex}
					notesToShow={notesToShow}
					bottomNote={bottomNote}
					isActive={activeIndex === eventIndex}
					handleNoteClicked={handleNoteClicked}
					handleMouseEnter={handleMouseEnter}
					handleMouseDown={handleMouseDown}
				/>
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

interface IEventProps {
	notes: number[]
	eventIndex: number
	notesToShow: number
	bottomNote: number
	isActive: boolean
	handleNoteClicked: GridSequencerEventHandler
	handleMouseEnter: GridSequencerEventHandler
	handleMouseDown: GridSequencerEventHandler
}

class Event extends React.PureComponent<IEventProps> {
	public render() {
		const {eventIndex, notesToShow, isActive} = this.props

		const placeholderNotesArray = Array.apply(0, new Array(notesToShow))

		return <div
			key={eventIndex}
			className={`event ${isActive ? 'active' : 'transitionAllColor'}`}
		>
			{placeholderNotesArray.map(this._renderNote)}
		</div>
	}

	private _renderNote = (_: any, i: number) => {
		const note = i + this.props.bottomNote
		const isEnabled = this.props.notes.includes(note)
		return <Note
			key={note}
			note={note}
			eventIndex={this.props.eventIndex}
			isEnabled={isEnabled}
			onClick={this.props.handleNoteClicked}
			onMouseEnter={this.props.handleMouseEnter}
			onMouseDown={this.props.handleMouseDown}
		/>
	}
}

interface INoteProps {
	note: number,
	eventIndex: number,
	isEnabled: boolean,
	onClick: GridSequencerEventHandler,
	onMouseEnter: GridSequencerEventHandler,
	onMouseDown: GridSequencerEventHandler
}

class Note extends React.PureComponent<INoteProps> {
	public render() {
		const {note, isEnabled} = this.props

		return <div
			className={`note ${isEnabled ? 'on' : ''} ${isWhiteKey(note) ? 'white' : 'black'}`}
			onClick={this._onClick}
			onMouseEnter={this._onMouseEnter}
			onMouseDown={this._onMouseDown}
			style={{
				backgroundColor: isEnabled ? getColorStringForMidiNote(note) : undefined,
				color: getColorStringForMidiNote(note),
			}}
		/>
	}

	private _onClick: MouseEventHandler =
		e => this.props.onClick(this.props.eventIndex, this.props.isEnabled, this.props.note, e)

	private _onMouseEnter: MouseEventHandler =
		e => this.props.onMouseEnter(this.props.eventIndex, this.props.isEnabled, this.props.note, e)

	private _onMouseDown: MouseEventHandler =
		e => this.props.onMouseDown(this.props.eventIndex, this.props.isEnabled, this.props.note, e)
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
