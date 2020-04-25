import React, {useState, useCallback} from 'react'
import * as Immutable from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {useNodeContext} from '../../CorgiNode'
import {ExpMidiTrackNode} from '../ExpMidiTrackNode'
import {useObjectChangedEvent, useNumberChangedEvent} from '../../hooks/useCorgiEvent'
import {MidiTrackClipZone} from './MidiTrackClipZone'

interface Props {
	readonly height: number
	readonly width: number
}

export const MidiTrackViewEditor = ({
	width, height,
}: Props) => {
	const nodeContext = useNodeContext() as ExpMidiTrackNode
	const track = useObjectChangedEvent(nodeContext.midiTimelineTrackParam.value)

	// const {x, y} = position
	const visibleWidth = width
	const visibleHeight = height

	const rate = useNumberChangedEvent(nodeContext.rate.onChange)
	const zoomX = useNumberChangedEvent(nodeContext.zoomX.onChange)
	// const zoomY = useNumberChangedEvent(nodeContext.zoomY.onChange)
	const panX = useNumberChangedEvent(nodeContext.panX.onChange)
	// const panY = useNumberChangedEvent(nodeContext.panY.onChange)

	// const lengthBeats = expMidiPatternView.loopEndBeat

	const [selected, setSelected] = useState(Immutable.Set<Id>())
	const [originalSelected, setOriginalSelected] = useState(Immutable.Set<Id>())
	const clearSelected = useCallback(() => setSelected(Immutable.Set()), [])

	const minimapHeight = 24
	const bottomMarkersHeight = 16
	const clipZoneHeight = Math.max(height - minimapHeight - bottomMarkersHeight, 64)

	return (
		<div className="midiTrackViewEditorInner">
			<div
				className="miniMap"
				style={{
					height: minimapHeight,
					width: visibleWidth,
					backgroundColor: CssColor.panelGrayTransparent,
				}}
			>
				miniMap
			</div>
			<div
				className="clipZone"
				style={{
					height: clipZoneHeight,
					width: visibleWidth,
					padding: '8px 0px 8px 0px',
					boxSizing: 'border-box',
					// backgroundColor: CssColor.panelGrayTransparent,
				}}
			>
				<MidiTrackClipZone />
			</div>
			<div
				className="bottomMarkers"
				style={{
					height: bottomMarkersHeight,
					width: visibleWidth,
					backgroundColor: CssColor.panelGrayTransparent,
				}}
			>
				bottomMarkers
			</div>
		</div>
	)
}