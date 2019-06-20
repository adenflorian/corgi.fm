import {List} from 'immutable'
import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {MidiClipEvents} from '../../common/midi-types'
import {IMidiNotes} from '../../common/MidiNote'
import {
	gridSequencerActions, GridSequencerFields, IClientAppState,
	selectGlobalClockState, selectGridSequencer,
} from '../../common/redux'
import {MAX_MIDI_NOTE_NUMBER_127, MIN_MIDI_NOTE_NUMBER_0} from '../../common/server-constants'
import {getColorStringForMidiNote} from '../../common/shamu-color'
import {isLeftMouseButtonDown} from '../client-utils'
import {isWhiteKey} from '../Keyboard/Keyboard'
import {VerticalScrollBar} from '../Knob/VerticalScrollBar'
import {getOctaveFromMidiNote, midiNoteToNoteName} from '../WebAudio'

type GridSequencerEventHandler = (index: number, isEnabled: boolean, i2: number, e: React.MouseEvent) => void

type MouseEventHandler = (e: React.MouseEvent) => void

interface IGridSequencerNotesProps {
	id: string
}

interface IGridSequencerNotesReduxProps {
	events: MidiClipEvents
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
	}, List<number>())

	return (
		<React.Fragment>
			<div className="noteNamesSidebar">
				{new Array(notesToShow).fill(0).map((_, i) => {
					const note = i + bottomNote
					const noteName = midiNoteToNoteName(note)
					return (
						<div
							key={i}
							className={`noteName ${isWhiteKey(note) ? 'white' : 'black'} ${noteName.toLowerCase() === 'c' ? 'c' : ''}`}
						>
							{noteName + getOctaveFromMidiNote(note)}
						</div>
					)
				})}
			</div>
			<div className="eventsBox">
				<div className="pianoRoll">
					{new Array(notesToShow).fill(0).map((_, i) => {
						const note = i + bottomNote
						return <div
							key={i}
							className={`row ${isWhiteKey(note) ? 'white' : 'black'}`}
						/>
					})}
				</div>
				<div className="events">
					{events.map((event, eventIndex) => {
						return <Event
							key={eventIndex}
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
				</div>
			</div>
			<VerticalScrollBar
				min={MIN_MIDI_NOTE_NUMBER_0}
				max={MAX_MIDI_NOTE_NUMBER_127 - notesToShow}
				value={bottomNote}
				onChange={handleScrollChange}
				marks={marks}
				sliderGrabberHeightPercentage={notesToShow * 100 / MAX_MIDI_NOTE_NUMBER_127}
			/>
		</React.Fragment>
	)
}

interface IEventProps {
	notes: IMidiNotes
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

	private readonly _renderNote = (_: any, i: number) => {
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
				borderRadius: 4,
			}}
		/>
	}

	private readonly _onClick: MouseEventHandler =
		e => this.props.onClick(this.props.eventIndex, this.props.isEnabled, this.props.note, e)

	private readonly _onMouseEnter: MouseEventHandler =
		e => this.props.onMouseEnter(this.props.eventIndex, this.props.isEnabled, this.props.note, e)

	private readonly _onMouseDown: MouseEventHandler =
		e => this.props.onMouseDown(this.props.eventIndex, this.props.isEnabled, this.props.note, e)
}

const mapStateToProps = (state: IClientAppState, props: IGridSequencerNotesProps): IGridSequencerNotesReduxProps => {
	const gridSequencerState = selectGridSequencer(state.room, props.id)

	return {
		events: gridSequencerState.midiClip.events,
		activeIndex: gridSequencerState.isPlaying
			? selectGlobalClockState(state.room).index % gridSequencerState.midiClip.events.count()
			: -1,
		bottomNote: gridSequencerState.scrollY,
		notesToShow: gridSequencerState.notesToShow,
	}
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: IGridSequencerNotesProps): IGridSequencerNotesDispatchProps => {
	const onMouse: GridSequencerEventHandler = (index, isEnabled, noteNumber, e) => {
		if (e.shiftKey && e.altKey && isLeftMouseButtonDown(e.buttons)) {
			dispatch(gridSequencerActions.setNote(id, index, !isEnabled, noteNumber))
		} else if (e.shiftKey && isEnabled === true && isLeftMouseButtonDown(e.buttons)) {
			dispatch(gridSequencerActions.setNote(id, index, false, noteNumber))
		} else if (e.altKey && isEnabled === false && isLeftMouseButtonDown(e.buttons)) {
			dispatch(gridSequencerActions.setNote(id, index, true, noteNumber))
		}
	}

	return {
		handleNoteClicked: (index, isEnabled, noteNumber) => {
			dispatch(gridSequencerActions.setNote(id, index, !isEnabled, noteNumber))
		},
		handleMouseEnter: onMouse,
		handleMouseDown: onMouse,
		handleScrollChange: newValue => {
			dispatch(gridSequencerActions.setField(id, GridSequencerFields.scrollY, Math.round(newValue)))
		},
	}
}

export const GridSequencerNotesConnected = connect(
	mapStateToProps,
	mapDispatchToProps,
)(GridSequencerNotes)
