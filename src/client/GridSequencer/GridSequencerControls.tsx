import * as React from 'react'
import {FaEraser} from 'react-icons/fa'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {
	exportSequencerMidi, GridSequencerFields, setGridSequencerField,
} from '../../common/redux/grid-sequencers-redux'
import {clearSequencer} from '../../common/redux/sequencer-redux'

interface IGridSequencerControlsProps {
	id: string
}

export const GridSequencerControls = (props: IGridSequencerControlsProps & {dispatch: Dispatch}) => {
	return (
		<div className="controls unselectable">
			<div
				className="play colorTransition"
				onClick={() => props.dispatch(setGridSequencerField(props.id, GridSequencerFields.isPlaying, true))}
			>
				▶
			</div>
			<div
				className="stop colorTransition"
				onClick={() => props.dispatch(setGridSequencerField(props.id, GridSequencerFields.isPlaying, false))}
			>
				◼
			</div>
			<div
				className="export colorTransition"
				onClick={() => props.dispatch(exportSequencerMidi(props.id))}
			>
				⭳
			</div>
			<div
				className="erase"
				onClick={() => props.dispatch(clearSequencer(props.id))}
			>
				<FaEraser />
			</div>
		</div>
	)
}

export const GridSequencerControlsConnected = connect()(GridSequencerControls)
