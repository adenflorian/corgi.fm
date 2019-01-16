import * as React from 'react'
import {
	IoMdDownload as Download, IoMdGrid as Rows, IoMdPlay as Play,
	IoMdRecording as Record, IoMdSquare as Stop, IoMdStar as Star,
	IoMdTrash as Clear, IoMdUndo as Undo,
} from 'react-icons/io'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {selectGlobalClockState} from '../../common/redux/global-clock-redux'
import {
	exportSequencerMidi, findLowestAndHighestNotes,
} from '../../common/redux/grid-sequencers-redux'
import {
	InfiniteSequencerFields, InfiniteSequencerStyle, selectAllInfiniteSequencers, setInfiniteSequencerField,
} from '../../common/redux/infinite-sequencers-redux'
import {clearSequencer, ISequencerEvent, undoSequencer} from '../../common/redux/sequencer-redux'
import {getColorStringForMidiNote} from '../../common/shamu-color'
import {isWhiteKey} from '../Keyboard/Keyboard'
import {getOctaveFromMidiNote, midiNoteToNoteName, removeOctave} from '../music/music-functions'
import {Panel} from '../Panel/Panel'
import './InfiniteSequencer.less'

interface IInfiniteSequencerProps {
	id: string
}

interface IInfiniteSequencerReduxProps {
	activeIndex: number
	color: string
	events: ISequencerEvent[]
	isPlaying: boolean
	isRecording: boolean
	name: string
	showRows: boolean
	style: InfiniteSequencerStyle
}

type IInfiniteSequencerAllProps =
	IInfiniteSequencerProps & IInfiniteSequencerReduxProps & {dispatch: Dispatch}

export const InfiniteSequencer: React.FunctionComponent<IInfiniteSequencerAllProps> = props => {
	const {color, isPlaying, id, isRecording, style, events} = props

	const {lowestNote, highestNote} = findLowestAndHighestNotes(events)
	const numberOfPossibleNotes = highestNote - lowestNote + 1
	const noteHeightPercentage = 100 / numberOfPossibleNotes
	const rows = []

	for (let i = highestNote; i >= lowestNote; i--) {
		rows.push(i)
	}

	return (
		<div
			className={
				`infiniteSequencer ` +
				`${isPlaying ? 'isPlaying saturate' : 'isNotPlaying'}` + ` ` +
				`${isRecording ? `isRecording` : ''}`
			}
		>
			<Panel id={props.id} label={name} color={isRecording ? 'red' : color}>
				<div className="controls">
					<div
						className="play"
						onClick={() => props.dispatch(
							setInfiniteSequencerField(id, InfiniteSequencerFields.isPlaying, true))}
					>
						<Play />
					</div>
					<div
						className="stop"
						onClick={() => props.dispatch(
							setInfiniteSequencerField(id, InfiniteSequencerFields.isPlaying, false))}
					>
						<Stop />
					</div>
					<div
						className="record"
						onClick={() => props.dispatch(
							setInfiniteSequencerField(id, InfiniteSequencerFields.isRecording, !isRecording))}
					>
						<Record />
					</div>
					<div
						className="export"
						onClick={() => props.dispatch(
							exportSequencerMidi(id))}
					>
						<Download />
					</div>
					<div
						className="erase"
						onClick={() => props.dispatch(clearSequencer(props.id))}
					>
						<Clear />
					</div>
					<div
						className="undo"
						onClick={() => props.dispatch(undoSequencer(props.id))}
					>
						<Undo />
					</div>
					<div
						className="style"
						onClick={() => props.dispatch(
							setInfiniteSequencerField(
								id,
								InfiniteSequencerFields.style,
								props.style === InfiniteSequencerStyle.colorBars
									? InfiniteSequencerStyle.colorGrid
									: InfiniteSequencerStyle.colorBars,
							),
						)}
					>
						<Star />
					</div>
					<div
						className={`showRows ${props.style === InfiniteSequencerStyle.colorGrid ? '' : 'disabled'}`}
						onClick={() => props.style === InfiniteSequencerStyle.colorGrid && props.dispatch(
							setInfiniteSequencerField(
								id,
								InfiniteSequencerFields.showRows,
								!props.showRows,
							),
						)}
					>
						<Rows />
					</div>
				</div>
				{style === InfiniteSequencerStyle.colorBars &&
					<div className={`display ${props.events.length > 8 ? 'small' : ''}`}>
						<div className="notes">
							{props.events.map((event, index) => {
								const note = event.notes[0] || -1

								return (
									< div
										key={index}
										className={`event ${props.activeIndex === index ? 'active' : ''}`}
										style={{
											backgroundColor: note === -1 ? 'none' : getColorStringForMidiNote(note),
										}}
									>
										{
											note === -1
												? undefined
												: props.events.length <= 8
													? midiNoteToNoteName(note) + getOctaveFromMidiNote(note)
													: undefined
										}
									</div>
								)
							},
							)}
						</div>
					</div>
				}
				{style === InfiniteSequencerStyle.colorGrid &&
					<div className={`display ${props.events.length > 8 ? 'small' : ''}`}>
						<div className="notes">
							{props.events.map(x => x.notes[0]).map((note, index) =>
								<div
									key={index}
									className={`event ${props.activeIndex === index ? 'active' : ''}`}
									style={{
										backgroundColor: note === -1 ? 'none' : getColorStringForMidiNote(note),
										height: `${noteHeightPercentage + (note === lowestNote ? 1 : 0)}%`,
										top: `${(highestNote - note) * noteHeightPercentage}%`,
									}}
								>
								</div>,
							)}
						</div>
						{props.showRows &&
							<div className="rows">
								{rows.map((_, index) => {
									return (
										<div
											key={index}
											className={`row ${isWhiteKey(index) ? 'white' : 'black'}`}
											style={{
												height: `${noteHeightPercentage + (index === lowestNote ? 1 : 0)}%`,
												top: `${(highestNote - index) * noteHeightPercentage}%`,
												width: '100%',
											}}
										/>
									)
								})}
							</div>
						}
					</div>
				}
			</Panel>
		</div >
	)
}

export const ConnectedInfiniteSequencer = connect(
	(state: IClientAppState, props: IInfiniteSequencerProps): IInfiniteSequencerReduxProps => {
		const infiniteSequencerState = selectAllInfiniteSequencers(state.room)[props.id]

		return {
			events: infiniteSequencerState.events,
			activeIndex: infiniteSequencerState.isPlaying
				? selectGlobalClockState(state.room).index % infiniteSequencerState.events.length
				: -1,
			isPlaying: infiniteSequencerState.isPlaying,
			isRecording: infiniteSequencerState.isRecording,
			color: infiniteSequencerState.color,
			name: infiniteSequencerState.name,
			showRows: infiniteSequencerState.showRows,
			style: infiniteSequencerState.style,
		}
	},
)(InfiniteSequencer)
