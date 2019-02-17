import * as React from 'react'
import {
	IoMdDownload as Download, IoMdPlay as Play, IoMdSquare as Stop,
	IoMdTrash as Clear, IoMdUndo as Undo,
} from 'react-icons/io'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {
	clearSequencer, exportSequencerMidi, globalClockActions,
	GridSequencerFields, setGridSequencerField, undoSequencer,
} from '../../common/redux'

interface IGridSequencerControlsProps {
	id: string
}

export const GridSequencerControls = (props: IGridSequencerControlsProps & {dispatch: Dispatch}) => {
	return (
		<div className="controls unselectable">
			<div
				className="play"
				onClick={() => {
					props.dispatch(setGridSequencerField(props.id, GridSequencerFields.isPlaying, true))
					props.dispatch(globalClockActions.start())
				}}
			>
				<Play />
			</div>
			<div
				className="stop"
				onClick={() => props.dispatch(setGridSequencerField(props.id, GridSequencerFields.isPlaying, false))}
			>
				<Stop />
			</div>
			<div
				className="export"
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
