import React, {useCallback} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {stripIndents} from 'common-tags'
import {
	FiDownload as Download, FiGrid as Rows, FiPlay as Play,
	FiCircle as Record, FiSquare as Stop,
	FiStar as Star, FiTrash2 as Clear, FiCornerUpLeft as Undo,
} from 'react-icons/fi'
import {
	sequencerActions, globalClockActions,
	selectInfiniteSequencerStyle, infiniteSequencerActions,
	InfiniteSequencerFields, InfiniteSequencerStyle,
	selectInfiniteSequencerShowRows, selectSequencer,
	IClientAppState,
} from '@corgifm/common/redux'
import {
	sequencerPlayToolTip, sequencerStopToolTip, sequencerRecordToolTip,
	sequencerDownloadToolTip, sequencerEraseToolTip, sequencerUndoToolTip,
} from './client-constants'

export const PlayIcon = Play
export const StopIcon = Stop

export const PlayButton = React.memo(({parentId}: {parentId: Id}) => {
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

export const StopButton = React.memo(({parentId}: {parentId: Id}) => {
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

export const RecordButton = React.memo(({parentId}: {parentId: Id}) => {
	const dispatch = useDispatch()
	const isRecording = useSelector((state: IClientAppState) => selectSequencer(state.room, parentId).isRecording)
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

export const ExportButton = React.memo(({parentId}: {parentId: Id}) => {
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

export const EraseButton = React.memo(({parentId}: {parentId: Id}) => {
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

export const UndoButton = React.memo(({parentId}: {parentId: Id}) => {
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

export const StyleButton = React.memo(({parentId}: {parentId: Id}) => {
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

export const ShowRowsButton = React.memo(({parentId}: {parentId: Id}) => {
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
