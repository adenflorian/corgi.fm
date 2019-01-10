import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {
	exportSequencerMidi, setGridSequencerField,
} from '../../common/redux/grid-sequencers-redux'
import {isProdClient} from '../is-prod-client'

interface IGridSequencerControlsProps {
	id: string
}

export const GridSequencerControls = (props: IGridSequencerControlsProps & {dispatch: Dispatch}) => {
	return (
		<div className="controls unselectable">
			<div
				className="play colorTransition"
				onClick={() => props.dispatch(setGridSequencerField(props.id, 'isPlaying', true))}
			>
				▶
			</div>
			<div
				className="stop colorTransition"
				onClick={() => props.dispatch(setGridSequencerField(props.id, 'isPlaying', false))}
			>
				◼
			</div>
			{/* Commented out until it can be implemented with new sequencer player code */}
			{/* <div
				className="restart colorTransition"
				onClick={() => props.dispatch(restartGridSequencer(props.id))}
			>
				↻
			</div> */}
			{isProdClient() === false &&
				<div
					className="export colorTransition"
					onClick={() => props.dispatch(exportSequencerMidi(props.id))}
				>
					⭳
				</div>
			}
		</div>
	)
}

export const GridSequencerControlsConnected = connect()(GridSequencerControls)