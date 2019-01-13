import * as React from 'react'
import {
	IoMdDownload as Download, IoMdNuclear as Clear, IoMdPlay as Play,
	IoMdSquare as Stop, IoMdUndo as Undo,
} from 'react-icons/io'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {
	exportSequencerMidi, GridSequencerFields, setGridSequencerField,
} from '../../common/redux/grid-sequencers-redux'
import {clearSequencer, undoSequencer} from '../../common/redux/sequencer-redux'

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
				<Play />
			</div>
			<div
				className="stop colorTransition"
				onClick={() => props.dispatch(setGridSequencerField(props.id, GridSequencerFields.isPlaying, false))}
			>
				<Stop />
			</div>
			<div
				className="export colorTransition"
				onClick={() => props.dispatch(exportSequencerMidi(props.id))}
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
		</div>
	)
}

export const GridSequencerControlsConnected = connect()(GridSequencerControls)
