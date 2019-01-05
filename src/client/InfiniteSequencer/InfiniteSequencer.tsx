import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {IGridSequencerEvent} from '../../common/redux/grid-sequencers-redux'
import {selectAllInfiniteSequencers, setInfiniteSequencerField} from '../../common/redux/infinite-sequencers-redux'
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
	name: string
}

type IInfiniteSequencerAllProps =
	IInfiniteSequencerProps & IInfiniteSequencerReduxProps & {dispatch: Dispatch}

export class InfiniteSequencer extends Component<IInfiniteSequencerAllProps> {
	public static defaultProps = {
		events: [],
	}

	public render() {
		const {color, isPlaying, id} = this.props

		return (
			<div className="infiniteSequencer">
				<div
					className={`gridSequencer ${isPlaying ? 'isPlaying saturate' : 'isNotPlaying'}`}
					style={{color}}
				>
					<div className="label transitionAllColor">{name}</div>
					<Panel id={this.props.id}>
						<div className="controls" style={{margin: 8}}>
							<div className="record">⬤</div>
							<div
								className="play"
								onClick={() => this.props.dispatch(setInfiniteSequencerField(id, 'isPlaying', true))}
							>
								▶
							</div>
							<div
								className="stop"
								onClick={() => this.props.dispatch(setInfiniteSequencerField(id, 'isPlaying', false))}
							>
								◼
							</div>
						</div>
						<div className="display">
							{this.props.events.map((event, index) =>
								<div key={index} className="event">
									{midiNoteToNoteName(event.notes[0]) + getOctaveFromMidiNote(event.notes[0])}
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
			color: infiniteSequencerState.color,
			name: infiniteSequencerState.name,
		}
	},
)(InfiniteSequencer)
