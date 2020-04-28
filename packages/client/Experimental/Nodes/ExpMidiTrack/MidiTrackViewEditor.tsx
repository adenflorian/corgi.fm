import React, {useState, useCallback, useMemo} from 'react'
import * as Immutable from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {useNodeContext} from '../../CorgiNode'
import {ExpMidiTrackNode} from '../ExpMidiTrackNode'
import {useObjectChangedEvent, useNumberChangedEvent} from '../../hooks/useCorgiEvent'
import {MidiTrackClipZone} from './MidiTrackClipZone'
import {minimapHeight, bottomMarkersHeight} from './MidiTrackConstants'

interface Props {
	readonly height: number
	readonly width: number
}

const minLengthBeats = 128

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

	const minScaledHeight = 400
	const minScaledWidth = 800

	const scaledWidth = Math.max(minScaledWidth * zoomX, minScaledWidth, visibleWidth)

	// const maxPanY = Math.max(scaledHeight - visibleHeight, 0)
	const maxPanX = Math.max(scaledWidth - visibleWidth, 0)
	const panPixelsX = panX * maxPanX

	const lengthBeats = useMemo(() => {
		return Math.max(track.timelineClips.map(x => x.startBeat + x.beatLength).toList().max() || 0, minLengthBeats)
	}, [track.timelineClips])

	const columnWidth = scaledWidth / lengthBeats

	// console.log({columnWidth, scaledWidth, lengthBeats})

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
				className="midiTrackClipZone"
				style={{
					height: clipZoneHeight,
					width: visibleWidth,
					overflow: 'hidden',
					position: 'relative',
					// backgroundColor: CssColor.panelGrayTransparent,
				}}
			>
				<MidiTrackClipZone {...{columnWidth, panPixelsX, clipZoneHeight}} />
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