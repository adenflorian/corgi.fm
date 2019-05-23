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
	findLowestAndHighestNotes, globalClockActions, IClientAppState,
	infiniteSequencerActions, InfiniteSequencerFields, InfiniteSequencerState,
	InfiniteSequencerStyle, selectConnectionSourceColorByTargetId, selectGlobalClockState, selectInfiniteSequencer, sequencerActions,
} from '../../common/redux'
import {getColorStringForMidiNote} from '../../common/shamu-color'
import {seqRateValueToString, sequencerGateToolTip, sequencerPitchToolTip, sequencerRateToolTip} from '../client-constants'
import {isWhiteKey} from '../Keyboard/Keyboard'
import {Knob} from '../Knob/Knob'
import {KnobSnapping} from '../Knob/KnobSnapping'
import {Panel} from '../Panel/Panel'
import {getOctaveFromMidiNote, midiNoteToNoteName, rateValues} from '../WebAudio/music-functions'
import './InfiniteSequencer.less'

interface IInfiniteSequencerProps {
	id: string
}

interface IInfiniteSequencerReduxProps {
	activeIndex: number
	color: string
	events: MidiClipEvents
	gate: number
	isPlaying: boolean
	isRecording: boolean
	name: string
	pitch: number
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

		if (events.count() > 0) {
			for (let i = highestNote; i >= lowestNote; i--) {
				rows.push(i)
			}
		}

		const dispatchInfiniteSeqParam = (paramType: InfiniteSequencerFields, value: number | boolean | string) =>
			dispatch(infiniteSequencerActions.setField(id, paramType, value))

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
						<div className="controls" style={{maxWidth: InfiniteSequencerState.controlsWidth}}>
							<div
								className="play"
								onClick={() => {
									dispatch(sequencerActions.play(id))
									dispatch(globalClockActions.start())
								}}
							>
								<Play />
							</div>
							<div
								className="stop"
								onClick={() => dispatch(sequencerActions.stop(id))}
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
								onClick={() => dispatch(sequencerActions.exportMidi(id))}
							>
								<Download />
							</div>
							<div
								className="erase"
								onClick={() => dispatch(sequencerActions.clear(props.id))}
							>
								<Clear />
							</div>
							<div
								className="undo"
								onClick={() => dispatch(sequencerActions.undo(props.id))}
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

							<Knob
								min={0}
								max={2}
								value={props.gate}
								defaultValue={0.5}
								onChange={dispatchInfiniteSeqParam}
								label="gate"
								onChangeId={InfiniteSequencerFields.gate}
								tooltip={sequencerGateToolTip}
							/>

							<Knob
								min={-12}
								max={12}
								value={props.pitch}
								defaultValue={0}
								onChange={dispatchInfiniteSeqParam}
								label="pitch"
								onChangeId={InfiniteSequencerFields.pitch}
								tooltip={sequencerPitchToolTip}
							/>

							<KnobSnapping
								value={props.rate}
								defaultIndex={rateValues.indexOf(1 / 4)}
								onChange={dispatchInfiniteSeqParam}
								label="rate"
								onChangeId={InfiniteSequencerFields.rate}
								tooltip={sequencerRateToolTip}
								valueString={seqRateValueToString}
								possibleValues={rateValues}
							/>
						</div>
						{style === InfiniteSequencerStyle.colorBars &&
							<div className={`display ${props.events.count() > 8 ? 'small' : ''}`}>
								<div className="notes">
									{props.events.map((event, index) => {
										const note = event.notes.first(-1)

										return (
											< div
												key={index}
												className={`event ${props.activeIndex === index ? 'active' : ''} largeFont`}
												style={{
													backgroundColor: note === -1 ? 'none' : getColorStringForMidiNote(note),
												}}
											>
												{note === -1
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
										{rows.map(note => (
											<div
												key={note}
												className={`row ${isWhiteKey(note) ? 'white' : 'black'}`}
												style={{
													height: `${noteHeightPercentage + (note === lowestNote ? 1 : 0)}%`,
													top: `${(highestNote - note) * noteHeightPercentage}%`,
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
			color: selectConnectionSourceColorByTargetId(state.room, props.id),
			gate: infiniteSequencerState.gate,
			name: infiniteSequencerState.name,
			pitch: infiniteSequencerState.pitch,
			rate: infiniteSequencerState.rate,
			showRows: infiniteSequencerState.showRows,
			style: infiniteSequencerState.style,
		}
	},
)(InfiniteSequencer)
