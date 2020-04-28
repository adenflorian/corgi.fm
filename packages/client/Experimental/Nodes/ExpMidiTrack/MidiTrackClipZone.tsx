import React, {useMemo} from 'react'
import {useNodeContext} from '../../CorgiNode'
import {ExpMidiTrackNode} from '../ExpMidiTrackNode'
import {useObjectChangedEvent} from '../../hooks/useCorgiEvent'
import {MidiTrackClipView} from './MidiTrackClipView'
import {CssColor} from '@corgifm/common/shamu-color'

interface Props {
	readonly columnWidth: number
	readonly panPixelsX: number
	readonly clipZoneHeight: number
}

export const MidiTrackClipZone = ({
	columnWidth, panPixelsX, clipZoneHeight,
}: Props) => {
	const nodeContext = useNodeContext() as ExpMidiTrackNode
	const track = useObjectChangedEvent(nodeContext.midiTimelineTrackParam.value)

	// console.log({track})

	const pathD = useMemo(() => {
		// TODO
		// const startBeat = 
		const count = 128
		const linesArray = new Array(count).fill(0)
			.map((_, i) => (i * columnWidth) - panPixelsX)
		return linesArray.reduce((result, x) => result + `M ${x} 0 L ${x} ${clipZoneHeight}`, '')
	}, [columnWidth, panPixelsX, clipZoneHeight])

	return (
		<>
			<svg className="midiTrackClipZoneLines" style={{position: 'absolute', left: 0, width: '100%', height: '100%'}}>
				<path
					d={pathD}
					strokeWidth={1}
					stroke={CssColor.gray2}
				/>
			</svg>
			<div
				className="midiTrackClipZoneInner"
				style={{
					padding: '8px 0px 8px 0px',
					boxSizing: 'border-box',
					height: '100%',
				}}
			>
				<div
					className="midiTrackClipZoneInnerPadded"
					style={{
						height: '100%',
						position: 'relative',
					}}
				>
					{track.timelineClips.map(clip =>
						<MidiTrackClipView
							key={clip.id as string}
							clip={clip}
							columnWidth={columnWidth}
							panPixelsX={panPixelsX}
						/>
					).toList()}
				</div>
			</div>
		</>
	)
}
