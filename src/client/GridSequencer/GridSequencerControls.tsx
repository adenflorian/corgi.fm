import * as React from 'react'
import {
	IoMdDownload as Download, IoMdPlay as Play, IoMdSquare as Stop,
	IoMdTrash as Clear, IoMdUndo as Undo,
} from 'react-icons/io'
import {Dispatch} from 'redux'
import {
	clearSequencer, exportSequencerMidi, globalClockActions,
	GridSequencerFields, selectGridSequencer,
	setGridSequencerField, shamuConnect, undoSequencer,
} from '../../common/redux'
import {Knob} from '../Knob/Knob'

interface IGridSequencerControlsProps {
	id: string
}

interface ReduxProps {
	gate: number
}

type AllProps = IGridSequencerControlsProps & ReduxProps & {dispatch: Dispatch}

export const GridSequencerControls = (props: AllProps) => {

	const dispatchGridSeqParam = (paramType: GridSequencerFields, value: number | boolean | string) =>
		props.dispatch(setGridSequencerField(props.id, paramType, value))

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
				onClick={() => dispatchGridSeqParam(GridSequencerFields.isPlaying, false)}
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
			<Knob
				min={0}
				max={2}
				value={props.gate}
				onChange={dispatchGridSeqParam}
				label="gate"
				onChangeId={GridSequencerFields.gate}
			/>
		</div>
	)
}

export const GridSequencerControlsConnected = shamuConnect(
	(state, {id}: IGridSequencerControlsProps): ReduxProps => ({
		gate: selectGridSequencer(state.room, id).gate,
	}),
)(GridSequencerControls)
