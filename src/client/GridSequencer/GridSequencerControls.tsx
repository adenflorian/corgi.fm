import {List} from 'immutable'
import _ from 'lodash'
import * as React from 'react'
import {
	IoMdDownload as Download, IoMdPlay as Play, IoMdRecording as Record,
	IoMdSquare as Stop, IoMdTrash as Clear, IoMdUndo as Undo,
} from 'react-icons/io'
import {Dispatch} from 'redux'
import {
	globalClockActions, gridSequencerActions, GridSequencerFields,
	GridSequencerState, selectGridSequencer, sequencerActions, shamuConnect,
} from '../../common/redux'
import {percentageValueString, seqGateValueToString, seqPitchValueToString, seqRateValueToString, sequencerDownloadToolTip, sequencerEraseToolTip, sequencerGateToolTip, sequencerPitchToolTip, sequencerPlayToolTip, sequencerRateToolTip, sequencerRecordToolTip, sequencerStopToolTip, sequencerUndoToolTip} from '../client-constants'
import {Knob} from '../Knob/Knob'
import {KnobSnapping} from '../Knob/KnobSnapping'
import {rateValues} from '../WebAudio'

interface IGridSequencerControlsProps {
	id: string
}

interface ReduxProps {
	gate: number
	pitch: number
	rate: number
	isRecording: boolean
}

type AllProps = IGridSequencerControlsProps & ReduxProps & {dispatch: Dispatch}

export const GridSequencerControls = (props: AllProps) => {

	const dispatchGridSeqParam = (paramType: GridSequencerFields, value: number | boolean | string) =>
		props.dispatch(gridSequencerActions.setField(props.id, paramType, value))

	return (
		<div className="controls unselectable" style={{width: GridSequencerState.controlsWidth}}>
			<div className="buttons">
				<div
					className="play"
					onClick={() => {
						props.dispatch(sequencerActions.play(props.id))
						props.dispatch(globalClockActions.start())
					}}
					title={sequencerPlayToolTip}
				>
					<Play />
				</div>
				<div
					className="stop"
					onClick={() => props.dispatch(sequencerActions.stop(props.id))}
					title={sequencerStopToolTip}
				>
					<Stop />
				</div>
				<div
					className="record"
					onClick={() => props.dispatch(sequencerActions.toggleRecording(props.id, !props.isRecording))}
					title={sequencerRecordToolTip}
				>
					<Record />
				</div>
				<div
					className="export"
					onClick={() => props.dispatch(sequencerActions.exportMidi(props.id))}
					title={sequencerDownloadToolTip}
				>
					<Download />
				</div>
				<div
					className="erase"
					onClick={() => props.dispatch(sequencerActions.clear(props.id))}
					title={sequencerEraseToolTip}
				>
					<Clear />
				</div>
				<div
					className="undo"
					onClick={() => props.dispatch(sequencerActions.undo(props.id))}
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
				<KnobSnapping
					value={props.pitch}
					defaultIndex={12}
					onChange={dispatchGridSeqParam}
					label="Pitch"
					onChangeId={GridSequencerFields.pitch}
					tooltip={sequencerPitchToolTip}
					valueString={seqPitchValueToString}
					possibleValues={List(_.range(-12, 13))}
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
