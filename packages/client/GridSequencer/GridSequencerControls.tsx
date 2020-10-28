import React from 'react'
import {
	FiDownload as Download, FiPlay as Play, FiCircle as Record,
	FiSquare as Stop, FiTrash2 as Clear, FiCornerUpLeft as Undo,
} from 'react-icons/fi'
import {useDispatch} from 'react-redux'
import {
	globalClockActions, gridSequencerActions, GridSequencerFields,
	GridSequencerState, selectGridSequencer, sequencerActions, shamuConnect,
} from '@corgifm/common/redux'
import {rateValues} from '@corgifm/common/common-samples-stuff'
import {
	percentageValueString, seqPitchValueToString, seqRateValueToString,
	sequencerDownloadToolTip, sequencerEraseToolTip,
	sequencerGateToolTip, sequencerPitchToolTip, sequencerPlayToolTip,
	sequencerRateToolTip, sequencerRecordToolTip,
	sequencerStopToolTip, sequencerUndoToolTip, pitchKnobSensitivity,
} from '../client-constants'
import {Knob} from '../Knob/Knob'
import {KnobIncremental} from '../Knob/KnobIncremental'
import {KnobSnapping} from '../Knob/KnobSnapping'

interface IGridSequencerControlsProps {
	id: Id
}

interface ReduxProps {
	gate: number
	pitch: number
	rate: number
	isRecording: boolean
}

type AllProps = IGridSequencerControlsProps & ReduxProps

export const GridSequencerControls = (props: AllProps) => {
	const dispatch = useDispatch()

	const dispatchGridSeqParam = (paramType: GridSequencerFields, value: number | boolean | string) =>
		dispatch(gridSequencerActions.setField(props.id, paramType, value))

	return (
		<div className="controls unselectable" style={{width: GridSequencerState.controlsWidth}}>
			<div className="buttons">
				<div
					className="play"
					onClick={() => {
						dispatch(sequencerActions.play(props.id))
						dispatch(globalClockActions.start())
					}}
					title={sequencerPlayToolTip}
				>
					<Play />
				</div>
				<div
					className="stop"
					onClick={() => dispatch(sequencerActions.stop(props.id))}
					title={sequencerStopToolTip}
				>
					<Stop />
				</div>
				<div
					className="record"
					onClick={() => dispatch(sequencerActions.toggleRecording(props.id, !props.isRecording))}
					title={sequencerRecordToolTip}
				>
					<Record />
				</div>
				<div
					className="export"
					onClick={() => dispatch(sequencerActions.exportMidi(props.id))}
					title={sequencerDownloadToolTip}
				>
					<Download />
				</div>
				<div
					className="erase"
					onClick={() => dispatch(sequencerActions.clear(props.id))}
					title={sequencerEraseToolTip}
				>
					<Clear />
				</div>
				<div
					className="undo"
					onClick={() => dispatch(sequencerActions.undo(props.id))}
					title={sequencerUndoToolTip}
				>
					<Undo />
				</div>
			</div>
			<div className="knobs">
				<Knob
					min={0}
					max={2}
					value={props.gate}
					defaultValue={0.5}
					onChange={dispatchGridSeqParam}
					label="Gate"
					onChangeId={GridSequencerFields.gate}
					tooltip={sequencerGateToolTip}
					valueString={percentageValueString}
				/>
				<KnobIncremental
					min={-12}
					max={12}
					value={props.pitch}
					defaultValue={0}
					onChange={dispatchGridSeqParam}
					label="Pitch"
					onChangeId={GridSequencerFields.pitch}
					tooltip={sequencerPitchToolTip}
					valueString={seqPitchValueToString}
					increment={1}
					sensitivity={pitchKnobSensitivity}
				/>
				<KnobSnapping
					value={props.rate}
					defaultIndex={rateValues.indexOf(1 / 8)}
					onChange={dispatchGridSeqParam}
					label="Rate"
					onChangeId={GridSequencerFields.rate}
					tooltip={sequencerRateToolTip}
					valueString={seqRateValueToString}
					possibleValues={rateValues}
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
			rate: gridSequencerState.rate,
			isRecording: gridSequencerState.isRecording,
		}
	},
)(GridSequencerControls)
