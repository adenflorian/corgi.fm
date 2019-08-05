import {stripIndents} from 'common-tags'
import React, {useCallback} from 'react'
import {
	IoMdDownload as Download, IoMdGrid as Rows, IoMdPlay as Play,
	IoMdRecording as Record, IoMdSquare as Stop,
	IoMdStar as Star, IoMdTrash as Clear, IoMdUndo as Undo,
} from 'react-icons/io'
import {connect, useDispatch, useSelector} from 'react-redux'
import {
	globalClockActions, IClientAppState,
	infiniteSequencerActions, InfiniteSequencerFields, InfiniteSequencerState,
	InfiniteSequencerStyle, selectConnectionSourceColorByTargetId,
	selectInfiniteSequencer, sequencerActions, selectInfiniteSequencerStyle,
	selectInfiniteSequencerShowRows, selectInfiniteSequencerIsRecording,
} from '@corgifm/common/redux'
import {CssColor} from '@corgifm/common/shamu-color'
import {rateValues} from '@corgifm/common/common-samples-stuff'
import {
	percentageValueString, seqLengthValueToString, seqPitchValueToString,
	seqRateValueToString, sequencerDownloadToolTip, sequencerEraseToolTip,
	sequencerGateToolTip, sequencerPitchToolTip, sequencerPlayToolTip,
	sequencerRateToolTip, sequencerRecordToolTip, sequencerStopToolTip,
	sequencerUndoToolTip,
	pitchKnobSensitivity,
} from '../client-constants'
import {Knob} from '../Knob/Knob'
import {KnobIncremental} from '../Knob/KnobIncremental'
import {KnobSnapping} from '../Knob/KnobSnapping'
import {Panel} from '../Panel/Panel'
import './InfiniteSequencer.less'
import {ConnectedInfiniteSequencerNotes} from './InfiniteSequencerNotes'

interface IInfiniteSequencerProps {
	id: Id
}

interface IInfiniteSequencerReduxProps {
	color: string
	gate: number
	isPlaying: boolean
	isRecording: boolean
	name: string
	pitch: number
	rate: number
	length: number
}

type IInfiniteSequencerAllProps =
	IInfiniteSequencerProps & IInfiniteSequencerReduxProps

export const InfiniteSequencer = (props: IInfiniteSequencerAllProps) => {
	const {color, isPlaying, id, isRecording, name, length, rate} = props

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
				label={name}
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
						<ShowRowsButton parentId={id} />
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

const PlayButton = React.memo(({parentId}: {parentId: Id}) => {
	const dispatch = useDispatch()
	const play = useCallback(
		() => {
			dispatch(sequencerActions.play(parentId))
			dispatch(globalClockActions.start())
		}, [dispatch, parentId])

	return (
		<div
			className="play"
			onClick={play}
			title={sequencerPlayToolTip}
		>
			<Play />
		</div>
	)
})

const StopButton = React.memo(({parentId}: {parentId: Id}) => {
	const dispatch = useDispatch()
	const stop = useCallback(
		() => dispatch(sequencerActions.stop(parentId)),
		[dispatch, parentId])

	return (
		<div
			className="stop"
			onClick={stop}
			title={sequencerStopToolTip}
		>
			<Stop />
		</div>
	)
})

const RecordButton = React.memo(({parentId}: {parentId: Id}) => {
	const dispatch = useDispatch()
	const isRecording = useSelector(selectInfiniteSequencerIsRecording(parentId))
	const toggleRecording = useCallback(
		() => dispatch(sequencerActions.toggleRecording(parentId, !isRecording)),
		[dispatch, parentId, isRecording])

	return (
		<div
			className="record"
			onClick={toggleRecording}
			title={sequencerRecordToolTip}
		>
			<Record />
		</div>
	)
})

const ExportButton = React.memo(({parentId}: {parentId: Id}) => {
	const dispatch = useDispatch()
	const exportMidi = useCallback(
		() => dispatch(sequencerActions.exportMidi(parentId)),
		[dispatch, parentId])

	return (
		<div
			className="export"
			onClick={exportMidi}
			title={sequencerDownloadToolTip}
		>
			<Download />
		</div>
	)
})

const EraseButton = React.memo(({parentId}: {parentId: Id}) => {
	const dispatch = useDispatch()
	const clear = useCallback(
		() => dispatch(sequencerActions.clear(parentId)),
		[dispatch, parentId])

	return (
		<div
			className="erase"
			onClick={clear}
			title={sequencerEraseToolTip}
		>
			<Clear />
		</div>
	)
})

const UndoButton = React.memo(({parentId}: {parentId: Id}) => {
	const dispatch = useDispatch()
	const undo = useCallback(
		() => dispatch(sequencerActions.undo(parentId)),
		[dispatch, parentId])

	return (
		<div
			className="undo"
			onClick={undo}
			title={sequencerUndoToolTip +
				`\nBackspace to undo while recording and your keyboard is plugged in`}
		>
			<Undo />
		</div>
	)
})

const StyleButton = React.memo(({parentId}: {parentId: Id}) => {
	const dispatch = useDispatch()
	const style = useSelector(selectInfiniteSequencerStyle(parentId))
	const changeStyle = useCallback(
		() => dispatch(
			infiniteSequencerActions.setField(
				parentId,
				InfiniteSequencerFields.style,
				style === InfiniteSequencerStyle.colorBars
					? InfiniteSequencerStyle.colorGrid
					: InfiniteSequencerStyle.colorBars,
			)
		), [dispatch, parentId, style])

	return (
		<div
			className="style"
			onClick={changeStyle}
			title={stripIndents`Toggle display styles`}
		>
			<Star />
		</div>
	)
})

const ShowRowsButton = React.memo(({parentId}: {parentId: Id}) => {
	const dispatch = useDispatch()
	const style = useSelector(selectInfiniteSequencerStyle(parentId))
	const showRows = useSelector(selectInfiniteSequencerShowRows(parentId))
	const changeShowRows = useCallback(
		() => style === InfiniteSequencerStyle.colorGrid &&
			dispatch(
				infiniteSequencerActions.setField(
					parentId,
					InfiniteSequencerFields.showRows,
					!showRows,
				)
			), [style, dispatch, parentId, showRows])

	return (
		<div
			className={`showRows ${style === InfiniteSequencerStyle.colorGrid
				? '' : 'disabled'}`}
			onClick={changeShowRows}
			title={stripIndents`Toggle piano roll lines`}
		>
			<Rows />
		</div>
	)
})

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
			name: infiniteSequencerState.name,
			pitch: infiniteSequencerState.pitch,
			rate: infiniteSequencerState.rate,
			length: infiniteSequencerState.midiClip.length,
		}
	},
)(InfiniteSequencer)
