import React, {useCallback} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {
	createBetterSeqZoomSelector, createBetterSeqPanSelector,
	sequencerActions, InfiniteSequencerFields, betterSequencerActions, BetterSequencerFields, createBetterSeqRateSelector, createBetterSeqGateSelector, createBetterSeqPitchSelector,
} from '@corgifm/common/redux'
import {
	minZoomX, maxZoomX, minZoomY, maxZoomY, minPan, maxPan,
} from '@corgifm/common/BetterConstants'
import {rateValues} from '@corgifm/common/common-samples-stuff'
import {Knob} from '../Knob/Knob'
import {
	percentageValueString, sequencerGateToolTip, sequencerPitchToolTip,
	seqPitchValueToString, pitchKnobSensitivity, sequencerRateToolTip,
	seqRateValueToString,
} from '../client-constants'
import {
	PlayButton, StopButton, RecordButton, ExportButton, EraseButton,
	UndoButton, StyleButton, ShowRowsButton,
} from '../CommonNodeButtons'
import {KnobIncremental} from '../Knob/KnobIncremental'
import {KnobSnapping} from '../Knob/KnobSnapping'

interface Props {
	id: Id
}

export const BetterSequencerControls = ({id}: Props) => {
	const zoom = useSelector(createBetterSeqZoomSelector(id))
	const pan = useSelector(createBetterSeqPanSelector(id))
	const rate = useSelector(createBetterSeqRateSelector(id))
	const gate = useSelector(createBetterSeqGateSelector(id))
	const pitch = useSelector(createBetterSeqPitchSelector(id))

	const dispatch = useDispatch()

	const setZoomX = useCallback((_, newZoomX: number) => {
		dispatch(sequencerActions.setZoom(id, {...zoom, x: newZoomX}))
	}, [dispatch, id, zoom])

	const setZoomY = useCallback((_, newZoomY: number) => {
		dispatch(sequencerActions.setZoom(id, {...zoom, y: newZoomY}))
	}, [dispatch, id, zoom])

	const setPanX = useCallback((_, newPanX: number) => {
		dispatch(sequencerActions.setPan(id, {...pan, x: newPanX}))
	}, [dispatch, id, pan])

	const setPanY = useCallback((_, newPanY: number) => {
		dispatch(sequencerActions.setPan(id, {...pan, y: newPanY}))
	}, [dispatch, id, pan])

	const dispatchBetterSeqParam = useCallback(
		(paramType: BetterSequencerFields, value: number | boolean | string) =>
			dispatch(betterSequencerActions.setField(id, paramType, value)),
		[dispatch, id]
	)

	return (
		<div className="controls">
			<div className="buttons">
				<PlayButton parentId={id} />
				<StopButton parentId={id} />
				{/* <RecordButton parentId={id} /> */}
				{/* <ExportButton parentId={id} /> */}
				<EraseButton parentId={id} />
				<UndoButton parentId={id} />
				{/* <StyleButton parentId={id} /> */}
				{/* <ShowRowsButton parentId={id} /> */}
			</div>
			<div className="knobs">
				<Knob
					min={0}
					max={2}
					value={gate}
					defaultValue={0.5}
					onChange={dispatchBetterSeqParam}
					label="Gate"
					onChangeId={InfiniteSequencerFields.gate}
					tooltip={sequencerGateToolTip}
					valueString={percentageValueString}
				/>
				<KnobIncremental
					min={-12}
					max={12}
					value={pitch}
					defaultValue={0}
					onChange={dispatchBetterSeqParam}
					label="Pitch"
					onChangeId={InfiniteSequencerFields.pitch}
					tooltip={sequencerPitchToolTip}
					valueString={seqPitchValueToString}
					increment={1}
					sensitivity={pitchKnobSensitivity}
				/>
				<KnobSnapping
					value={rate}
					defaultIndex={rateValues.indexOf(1 / 4)}
					onChange={dispatchBetterSeqParam}
					label="Rate"
					onChangeId={InfiniteSequencerFields.rate}
					tooltip={sequencerRateToolTip}
					valueString={seqRateValueToString}
					possibleValues={rateValues}
				/>
			</div>
			<div className="zoomPanKnobs">
				<Knob
					defaultValue={1}
					label={`Zoom X`}
					min={minZoomX}
					max={maxZoomX}
					onChange={setZoomX}
					tooltip={`zoom x`}
					value={zoom.x}
				/>
				<Knob
					defaultValue={1}
					label={`Zoom Y`}
					min={minZoomY}
					max={maxZoomY}
					onChange={setZoomY}
					tooltip={`zoom Y`}
					value={zoom.y}
				/>
				<Knob
					defaultValue={1}
					label={`Pan X`}
					min={minPan}
					max={maxPan}
					onChange={setPanX}
					tooltip={`pan x`}
					value={pan.x}
					valueString={percentageValueString}
				/>
				<Knob
					defaultValue={1}
					label={`Pan Y`}
					min={minPan}
					max={maxPan}
					onChange={setPanY}
					tooltip={`pan Y`}
					value={pan.y}
					valueString={percentageValueString}
				/>
			</div>
		</div>
	)
}
