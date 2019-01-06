import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {IGridSequencerEvent} from '../../common/redux/grid-sequencers-redux'
import {
	InfiniteSequencerFields, selectAllInfiniteSequencers, setInfiniteSequencerField,
} from '../../common/redux/infinite-sequencers-redux'
import {getOctaveFromMidiNote, midiNoteToNoteName} from '../music/music-functions'
import {Panel} from '../Panel'
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
}

type IInfiniteSequencerAllProps =
	IInfiniteSequencerProps & IInfiniteSequencerReduxProps & {dispatch: Dispatch}

export class InfiniteSequencer extends Component<IInfiniteSequencerAllProps> {
	public static defaultProps = {
		events: [],
	}

	public render() {
		const {color, isPlaying, id, isRecording} = this.props

		return (
			<div className="infiniteSequencer">
				<div
					className={`gridSequencer ${isPlaying ? 'isPlaying saturate' : 'isNotPlaying'}`}
					style={{color: isRecording ? 'red' : color}}
				>
					<div className="label transitionAllColor">{name}</div>
					<Panel id={this.props.id}>
						<div className="controls" style={{margin: 8}}>
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
						</div>
						<div className={`display ${this.props.events.length > 8 ? 'small' : ''}`}>
							{this.props.events.map((event, index) =>
								<div
									key={index}
									className="event"
									style={{
										backgroundColor: `hsl(${event.notes[0]}, 90%, 50%)`,
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
					</Panel>
				</div>
			</div>
		)
	}
}

export const ConnectedInfiniteSequencer = connect(
	(state: IClientAppState, props: IInfiniteSequencerProps): IInfiniteSequencerReduxProps => {
		const infiniteSequencerState = selectAllInfiniteSequencers(state.room)[props.id]

		return {
			events: infiniteSequencerState.events,
			activeIndex: infiniteSequencerState.index,
			isPlaying: infiniteSequencerState.isPlaying,
			isRecording: infiniteSequencerState.isRecording,
			color: infiniteSequencerState.color,
			name: infiniteSequencerState.name,
		}
	},
)(InfiniteSequencer)
