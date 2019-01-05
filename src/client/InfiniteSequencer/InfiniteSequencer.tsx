import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Action} from 'redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {IGridSequencerEvent} from '../../common/redux/grid-sequencers-redux'
import {selectAllInfiniteSequencers} from '../../common/redux/infinite-sequencers-redux'
import {getOctaveFromMidiNote, midiNoteToNoteName} from '../music/music-functions'
import {Panel} from '../Panel'
import './InfiniteSequencer.less'

interface IInfiniteSequencerProps {
	id: string
}

interface IInfiniteSequencerReduxProps {
	events: IGridSequencerEvent[]
	activeIndex: number
}

type IInfiniteSequencerAllProps =
	IInfiniteSequencerProps & IInfiniteSequencerReduxProps

export class InfiniteSequencer extends Component<IInfiniteSequencerAllProps> {
	public static defaultProps = {
		events: [],
	}

	public render() {
		return (
			<div className="infiniteSequencer">
				<Panel id={this.props.id}>
					<div className="controls" style={{margin: 8}}>
						<div className="record">⬤</div>
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
		)
	}
}

export const ConnectedInfiniteSequencer = connect(
	(state: IClientAppState, props: IInfiniteSequencerProps): IInfiniteSequencerReduxProps => {
		const infiniteSequencerState = selectAllInfiniteSequencers(state.room)[props.id]

		return {
			events: infiniteSequencerState.events,
			activeIndex: infiniteSequencerState.index,
		}
	},
)(InfiniteSequencer)
