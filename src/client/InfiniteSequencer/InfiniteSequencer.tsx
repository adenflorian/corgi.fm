import * as React from 'react'
import {
	IoMdDownload as Download, IoMdGrid as Rows, IoMdPlay as Play, IoMdRecording as Record, IoMdSquare as Stop,
	IoMdStar as Star, IoMdTrash as Clear, IoMdUndo as Undo,
} from 'react-icons/io'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {MidiClipEvents} from '../../common/midi-types'
import {IMidiNote} from '../../common/MidiNote'
import {
	clearSequencer, exportSequencerMidi, findLowestAndHighestNotes, globalClockActions, IClientAppState,
	InfiniteSequencerFields, InfiniteSequencerStyle, selectGlobalClockState, selectInfiniteSequencer,
	setInfiniteSequencerField, undoSequencer,
} from '../../common/redux'
import {getColorStringForMidiNote} from '../../common/shamu-color'
import {isWhiteKey} from '../Keyboard/Keyboard'
import {Knob} from '../Knob/Knob'
import {Panel} from '../Panel/Panel'
import {ConnectedSequencerTimeBar} from '../SequencerTimeBar'
import {getOctaveFromMidiNote, midiNoteToNoteName} from '../WebAudio/music-functions'
import './InfiniteSequencer.less'

interface IInfiniteSequencerProps {
	id: string
}

interface IInfiniteSequencerReduxProps {
	activeIndex: number
	color: string
	events: MidiClipEvents
	isPlaying: boolean
	isRecording: boolean
	name: string
	rate: number
	showRows: boolean
	style: InfiniteSequencerStyle
}

type IInfiniteSequencerAllProps =
	IInfiniteSequencerProps & IInfiniteSequencerReduxProps & {dispatch: Dispatch}

export const InfiniteSequencer: React.FC<IInfiniteSequencerAllProps> = React.memo(
	function _InfiniteSequencer(props) {
		const {color, isPlaying, id, isRecording, style, events, name, rate, dispatch} = props

		const {lowestNote, highestNote} = findLowestAndHighestNotes(events)
		const numberOfPossibleNotes = highestNote - lowestNote + 1
		const noteHeightPercentage = 100 / numberOfPossibleNotes
		const rows = [] as any[]

		for (let i = highestNote; i >= lowestNote; i--) {
			rows.push(i)
		}

		const dispatchInfiniteSeqParam = (paramType: InfiniteSequencerFields, value: number | boolean | string) =>
			dispatch(setInfiniteSequencerField(id, paramType, value))

		const ColorGridNote = React.memo(function _ColorGridNote({note, index}: {note: IMidiNote, index: number}) {
			return (
				<div
					className={`event ${props.activeIndex === index ? 'active' : ''}`}
					style={{
						backgroundColor: note === -1 ? 'none' : getColorStringForMidiNote(note),
						height: `${noteHeightPercentage + (note === lowestNote ? 1 : 0)}%`,
						top: `${(highestNote - note) * noteHeightPercentage}%`,
					}}
				/>
			)
		})

		return render()

		function render() {
			return (
				<div
					className={
						`infiniteSequencer ` +
						`${isPlaying ? 'isPlaying saturate' : 'isNotPlaying'}` + ` ` +
						`${isRecording ? `isRecording` : ''}`
					}
				>
					<Panel
						id={props.id}
						label={name}
						color={isRecording ? 'red' : color}
						saturate={isPlaying}
					>
						<div className="controls">
							<div
								className="play"
								onClick={() => {
									dispatchInfiniteSeqParam(InfiniteSequencerFields.isPlaying, true)
									dispatch(globalClockActions.start())
								}}
							>
								<Play />
							</div>
							<div
								className="stop"
								onClick={() => dispatchInfiniteSeqParam(InfiniteSequencerFields.isPlaying, false)}
							>
								<Stop />
							</div>
							<div
								className="record"
								onClick={() => dispatchInfiniteSeqParam(InfiniteSequencerFields.isRecording, !isRecording)}
							>
								<Record />
							</div>
							<div
								className="export"
								onClick={() => dispatch(
									exportSequencerMidi(id))}
							>
								<Download />
							</div>
							<div
								className="erase"
								onClick={() => dispatch(clearSequencer(props.id))}
							>
								<Clear />
							</div>
							<div
								className="undo"
								onClick={() => dispatch(undoSequencer(props.id))}
								title="undo (hit backspace to undo while recording)"
							>
								<Undo />
							</div>

							<div
								className="style"
								onClick={() => dispatchInfiniteSeqParam(
									InfiniteSequencerFields.style,
									props.style === InfiniteSequencerStyle.colorBars
										? InfiniteSequencerStyle.colorGrid
										: InfiniteSequencerStyle.colorBars,
								)}
							>
								<Star />
							</div>
							<div
								className={`showRows ${props.style === InfiniteSequencerStyle.colorGrid ? '' : 'disabled'}`}
								onClick={() => props.style === InfiniteSequencerStyle.colorGrid && dispatchInfiniteSeqParam(
									InfiniteSequencerFields.showRows,
									!props.showRows,
								)}
							>
								<Rows />
							</div>

							{/* <Knob
							min={1}
							max={8}
							value={rate}
							onChange={dispatchInfiniteSeqParam}
							label="rate"
							onChangeId={InfiniteSequencerFields.rate}
						/> */}
						</div>
						{style === InfiniteSequencerStyle.colorBars &&
							<div className={`display ${props.events.count() > 8 ? 'small' : ''}`}>
								<div className="notes">
									{props.events.map((event, index) => {
										const note = event.notes.first(-1)

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
														: props.events.count() <= 8
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
							<div className={`display ${props.events.count() > 8 ? 'small' : ''}`}>
								<div className="notes">
									{props.events.map(x => x.notes.first(-1)).map((note, index) =>
										<ColorGridNote note={note} index={index} key={index} />,
									)}
								</div>
								{props.showRows &&
									<div className="rows">
										{rows.map((_, index) =>
											(
												<div
													key={index}
													className={`row ${isWhiteKey(index) ? 'white' : 'black'}`}
													style={{
														height: `${noteHeightPercentage + (index === lowestNote ? 1 : 0)}%`,
														top: `${(highestNote - index) * noteHeightPercentage}%`,
														width: '100%',
													}}
												/>
											))}
									</div>
								}
								{/* <ConnectedSequencerTimeBar
									isArmed={isPlaying}
									lengthBeats={props.events.count()}
								/> */}
							</div>
						}
					</Panel>
				</div >
			)
		}
	},
)

export const ConnectedInfiniteSequencer = connect(
	(state: IClientAppState, props: IInfiniteSequencerProps): IInfiniteSequencerReduxProps => {
		const infiniteSequencerState = selectInfiniteSequencer(state.room, props.id)

		return {
			events: infiniteSequencerState.midiClip.events,
			activeIndex: infiniteSequencerState.isPlaying
				? (selectGlobalClockState(state.room).index / Math.round(infiniteSequencerState.rate)) % infiniteSequencerState.midiClip.events.count()
				: -1,
			isPlaying: infiniteSequencerState.isPlaying,
			isRecording: infiniteSequencerState.isRecording,
			color: infiniteSequencerState.color,
			name: infiniteSequencerState.name,
			rate: infiniteSequencerState.rate,
			showRows: infiniteSequencerState.showRows,
			style: infiniteSequencerState.style,
		}
	},
)(InfiniteSequencer)
