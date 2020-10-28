import {stripIndents} from 'common-tags'
import React, {useCallback} from 'react'
import {connect, useDispatch} from 'react-redux'
import {
	IClientAppState,
	infiniteSequencerActions, InfiniteSequencerFields, InfiniteSequencerState,
	selectConnectionSourceColorByTargetId, selectInfiniteSequencer, getNodeInfo,
} from '@corgifm/common/redux'
import {CssColor} from '@corgifm/common/shamu-color'
import {rateValues} from '@corgifm/common/common-samples-stuff'
import {
	percentageValueString, seqLengthValueToString, seqPitchValueToString,
	seqRateValueToString, sequencerGateToolTip, sequencerPitchToolTip,
	sequencerRateToolTip, pitchKnobSensitivity,
} from '../client-constants'
import {Knob} from '../Knob/Knob'
import {KnobIncremental} from '../Knob/KnobIncremental'
import {KnobSnapping} from '../Knob/KnobSnapping'
import {Panel} from '../Panel/Panel'
import './InfiniteSequencer.less'
import {
	PlayButton, StopButton, RecordButton, ExportButton, EraseButton,
	UndoButton, StyleButton, ShowRowsButton,
} from '../CommonNodeButtons'
import {ConnectedInfiniteSequencerNotes} from './InfiniteSequencerNotes'

interface IInfiniteSequencerProps {
	id: Id
}

interface IInfiniteSequencerReduxProps {
	color: string
	gate: number
	isPlaying: boolean
	isRecording: boolean
	pitch: number
	rate: number
	length: number
}

type IInfiniteSequencerAllProps =
	IInfiniteSequencerProps & IInfiniteSequencerReduxProps

export const InfiniteSequencer = (props: IInfiniteSequencerAllProps) => {
	const {color, isPlaying, id, isRecording, length, rate} = props

	const dispatch = useDispatch()

	const dispatchInfiniteSeqParam = useCallback(
		(paramType: InfiniteSequencerFields, value: number | boolean | string) =>
			dispatch(infiniteSequencerActions.setField(id, paramType, value)),
		[dispatch, id]
	)

	return (
		<div
			className={
				`infiniteSequencer ` +
				`${isPlaying ? 'isPlaying saturate ' : 'isNotPlaying '}` +
				`${isRecording ? `isRecording` : ''}`
			}
		>
			<Panel
				id={props.id}
				label={getNodeInfo().infiniteSequencer.typeName}
				color={isRecording ? CssColor.red : color}
				saturate={isPlaying}
				helpText={stripIndents`Plug your keyboard into the infinite sequencer, hit record, and play notes
							Hit backspace to undo and right arrow key to insert a rest`}
				extra={seqLengthValueToString(rate / 4 * length)}
			>
				<div className="controls" style={{width: InfiniteSequencerState.controlsWidth}}>
					<div className="buttons">
						<PlayButton parentId={id} />
						<StopButton parentId={id} />
						<RecordButton parentId={id} />
						<ExportButton parentId={id} />
						<EraseButton parentId={id} />
						<UndoButton parentId={id} />
						<StyleButton parentId={id} />
						{/* <ShowRowsButton parentId={id} /> */}
					</div>
					<div className="knobs">
						<Knob
							min={0}
							max={2}
							value={props.gate}
							defaultValue={0.5}
							onChange={dispatchInfiniteSeqParam}
							label="Gate"
							onChangeId={InfiniteSequencerFields.gate}
							tooltip={sequencerGateToolTip}
							valueString={percentageValueString}
						/>
						<KnobIncremental
							min={-12}
							max={12}
							value={props.pitch}
							defaultValue={0}
							onChange={dispatchInfiniteSeqParam}
							label="Pitch"
							onChangeId={InfiniteSequencerFields.pitch}
							tooltip={sequencerPitchToolTip}
							valueString={seqPitchValueToString}
							increment={1}
							sensitivity={pitchKnobSensitivity}
						/>
						<KnobSnapping
							value={props.rate}
							defaultIndex={rateValues.indexOf(1 / 4)}
							onChange={dispatchInfiniteSeqParam}
							label="Rate"
							onChangeId={InfiniteSequencerFields.rate}
							tooltip={sequencerRateToolTip}
							valueString={seqRateValueToString}
							possibleValues={rateValues}
						/>
					</div>
				</div>
				<ConnectedInfiniteSequencerNotes id={id} />
			</Panel>
		</div>
	)
}

export const ConnectedInfiniteSequencer = connect(
	(
		state: IClientAppState, props: IInfiniteSequencerProps
	): IInfiniteSequencerReduxProps => {
		const infiniteSequencerState = selectInfiniteSequencer(state.room, props.id)

		return {
			isPlaying: infiniteSequencerState.isPlaying,
			isRecording: infiniteSequencerState.isRecording,
			color: selectConnectionSourceColorByTargetId(state, props.id),
			gate: infiniteSequencerState.gate,
			pitch: infiniteSequencerState.pitch,
			rate: infiniteSequencerState.rate,
			length: infiniteSequencerState.midiClip.length,
		}
	},
)(InfiniteSequencer)
