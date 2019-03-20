import * as React from 'react'
import {
	IoMdDownload as Download, IoMdPlay as Play, IoMdRecording as Record,
	IoMdSquare as Stop, IoMdTrash as Clear, IoMdUndo as Undo,
} from 'react-icons/io'
import {Dispatch} from 'redux'
import {
	globalClockActions, gridSequencerActions, GridSequencerFields,
	selectGridSequencer, sequencerActions, shamuConnect,
} from '../../common/redux'
import {Knob} from '../Knob/Knob'

interface IGridSequencerControlsProps {
	id: string
}

interface ReduxProps {
	gate: number
	pitch: number
}

type AllProps = IGridSequencerControlsProps & ReduxProps & {dispatch: Dispatch}

export const GridSequencerControls = (props: AllProps) => {

	const dispatchGridSeqParam = (paramType: GridSequencerFields, value: number | boolean | string) =>
		props.dispatch(gridSequencerActions.setField(props.id, paramType, value))

	return (
		<div className="controls unselectable">
			<div className="buttons">
				<div
					className="play"
					onClick={() => {
						props.dispatch(gridSequencerActions.setField(props.id, GridSequencerFields.isPlaying, true))
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
					className="readonly"
					title="coming soon™️"
				>
					<Record />
				</div>
				<div
					className="export"
					onClick={() => props.dispatch(sequencerActions.exportMidi(props.id))}
				>
					<Download />
				</div>
				<div
					className="erase"
					onClick={() => props.dispatch(sequencerActions.clear(props.id))}
				>
					<Clear />
				</div>
				<div
					className="undo"
					onClick={() => props.dispatch(sequencerActions.undo(props.id))}
				>
					<Undo />
				</div>
			</div>
			<div className="knobs">
				<Knob
					min={0}
					max={2}
					value={props.gate}
					onChange={dispatchGridSeqParam}
					label="gate"
					onChangeId={GridSequencerFields.gate}
				/>
				<Knob
					min={-12}
					max={12}
					value={props.pitch}
					onChange={dispatchGridSeqParam}
					label="pitch"
					onChangeId={GridSequencerFields.pitch}
				/>
			</div>
		</div>
	)
}

export const GridSequencerControlsConnected = shamuConnect(
	(state, {id}: IGridSequencerControlsProps): ReduxProps => {
		const gridSequencerState = selectGridSequencer(state.room, id)

		return {
			gate: gridSequencerState.gate,
			pitch: gridSequencerState.pitch,
		}
	},
)(GridSequencerControls)
