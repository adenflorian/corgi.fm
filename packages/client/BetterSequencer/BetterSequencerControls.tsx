import React, {useCallback} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {
	createBetterSeqZoomSelector, createBetterSeqPanSelector, sequencerActions,
} from '@corgifm/common/redux'
import {Knob} from '../Knob/Knob'
import {percentageValueString} from '../client-constants'
import {
	minZoomX, maxZoomX, minZoomY, maxZoomY, minPan, maxPan,
} from './BetterConstants'

interface Props {
	id: Id
}

export const BetterSequencerControls = ({id}: Props) => {
	const zoom = useSelector(createBetterSeqZoomSelector(id))
	const pan = useSelector(createBetterSeqPanSelector(id))

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

	return (
		<div className="controls">
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
	)
}
