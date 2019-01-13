import * as React from 'react'
import {Component} from 'react'
import {FaEraser, FaStar} from 'react-icons/fa'
import {IoMdStar as Star} from 'react-icons/io'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {selectGlobalClockState} from '../../common/redux/global-clock-redux'
import {
	exportSequencerMidi, findLowestAndHighestNotes, IGridSequencerEvent,
} from '../../common/redux/grid-sequencers-redux'
import {
	InfiniteSequencerFields, InfiniteSequencerStyle, selectAllInfiniteSequencers, setInfiniteSequencerField,
} from '../../common/redux/infinite-sequencers-redux'
import {getOctaveFromMidiNote, midiNoteToNoteName, removeOctave} from '../music/music-functions'
import {Panel} from '../Panel/Panel'
import './InfiniteSequencer.less'

interface IInfiniteSequencerProps {
	id: string
}

interface IInfiniteSequencerReduxProps {
	activeIndex: number
	color: string
	events: IGridSequencerEvent[]
	isPlaying: boolean
	isRecording: boolean
	name: string
	style: InfiniteSequencerStyle
}

type IInfiniteSequencerAllProps =
	IInfiniteSequencerProps & IInfiniteSequencerReduxProps & {dispatch: Dispatch}

export class InfiniteSequencer extends Component<IInfiniteSequencerAllProps> {
	public static defaultProps = {
		events: [],
	}

	public render() {
		const {color, isPlaying, id, isRecording, style, events} = this.props

		const {lowestNote, highestNote} = findLowestAndHighestNotes(events)
		const numberOfPossibleNotes = highestNote - lowestNote + 1
		const noteHeightPercentage = 100 / numberOfPossibleNotes

		return (
			<div
				className={
					`infiniteSequencer ` +
					`${isPlaying ? 'isPlaying saturate' : 'isNotPlaying'}` + ` ` +
					`${isRecording ? `isRecording` : ''}`
				}
			>
				<Panel id={this.props.id} label={name} color={isRecording ? 'red' : color}>
					<div className="controls">
						<div
							className="play"
							onClick={() => this.props.dispatch(
								setInfiniteSequencerField(id, InfiniteSequencerFields.isPlaying, true))}
						>
							▶
						</div>
						<div
							className="stop"
							onClick={() => this.props.dispatch(
								setInfiniteSequencerField(id, InfiniteSequencerFields.isPlaying, false))}
						>
							◼
						</div>
						<div
							className="record"
							onClick={() => this.props.dispatch(
								setInfiniteSequencerField(id, InfiniteSequencerFields.isRecording, !isRecording))}
						>
							⬤
						</div>
						<div
							className="export"
							onClick={() => this.props.dispatch(
								exportSequencerMidi(id))}
						>
							⭳
						</div>
						{/* <div
							className="erase"
						// onClick={() => this.props.dispatch(
						// 	exportSequencerMidi(id))}
						>
							<FaEraser />
						</div> */}
						<div
							className="style"
							onClick={() => this.props.dispatch(
								setInfiniteSequencerField(
									id,
									InfiniteSequencerFields.style,
									this.props.style === InfiniteSequencerStyle.colorBars
										? InfiniteSequencerStyle.colorGrid
										: InfiniteSequencerStyle.colorBars,
								),
							)}
						>
							<Star />
						</div>
					</div>
					{style === InfiniteSequencerStyle.colorBars &&
						<div className={`display ${this.props.events.length > 8 ? 'small' : ''}`}>
							{this.props.events.map((event, index) =>
								<div
									key={index}
									className={`event ${this.props.activeIndex === index ? 'active' : ''}`}
									style={{
										backgroundColor: `hsl(${removeOctave(event.notes[0]) * 23}, ${event.notes[0] + 10}%, 60%)`,
									}}
								>
									{
										this.props.events.length <= 8
											? midiNoteToNoteName(event.notes[0]) + getOctaveFromMidiNote(event.notes[0])
											: undefined
									}
								</div>,
							)}
						</div>
					}
					{style === InfiniteSequencerStyle.colorGrid &&
						<div className={`display ${this.props.events.length > 8 ? 'small' : ''}`}>
							{this.props.events.map(x => x.notes[0]).map((note, index) =>
								<div
									key={index}
									className={`event ${this.props.activeIndex === index ? 'active' : ''}`}
									style={{
										backgroundColor: `hsl(${removeOctave(note) * 23}, 60%, 60%)`,
										height: `${noteHeightPercentage + (note === lowestNote ? 1 : 0)}%`,
										top: `${(highestNote - note) * noteHeightPercentage}%`,
									}}
								>
								</div>,
							)}
						</div>
					}
				</Panel>
			</div>
		)
	}
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
			style: infiniteSequencerState.style,
		}
	},
)(InfiniteSequencer)
