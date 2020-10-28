import React, {useMemo} from 'react'
import {CssColor} from '@corgifm/common/shamu-color'
import {getMeasureLines, getBeatLines, getSmallerLines} from './MidiTrackLinesHelper'

interface Props {
	readonly columnWidth: number
	readonly panPixelsX: number
	readonly clipZoneHeight: number
	readonly visibleWidth: number
}

export const MidiTrackClipZoneLines = React.memo(function _MidiTrackClipZoneLines({
	columnWidth, panPixelsX, clipZoneHeight, visibleWidth,
}: Props) {
	const measureLines = useMemo(() => {
		return getMeasureLines(columnWidth, panPixelsX, visibleWidth, clipZoneHeight)
	}, [columnWidth, panPixelsX, clipZoneHeight, visibleWidth])

	const beatLines = useMemo(() => {
		return getBeatLines(columnWidth, panPixelsX, visibleWidth, clipZoneHeight)
	}, [columnWidth, panPixelsX, clipZoneHeight, visibleWidth])

	const smallerLines = useMemo(() => {
		return getSmallerLines(columnWidth, panPixelsX, visibleWidth, clipZoneHeight)
	}, [columnWidth, panPixelsX, clipZoneHeight, visibleWidth])

	return (
		<svg className="midiTrackClipZoneLines" style={{position: 'absolute', left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.2}}>
			<path
				d={measureLines}
				strokeWidth={2}
				stroke={`hsla(0, 0%, 0%, 1)`}
			/>
			<path
				d={beatLines}
				strokeWidth={2}
				stroke={`hsla(0, 0%, 8%, 1)`}
			/>
			<path
				d={smallerLines}
				strokeWidth={2}
				stroke={`hsla(0, 0%, 10%, 1)`}
			/>
		</svg>
	)
})
