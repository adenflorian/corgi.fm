import React, {useMemo} from 'react'
import {CssColor} from '@corgifm/common/shamu-color'

interface Props {
	readonly columnWidth: number
	readonly panPixelsX: number
	readonly clipZoneHeight: number
	readonly visibleWidth: number
}

// Pixel width of section that should have 1 line max
const maxDensity = 50

export const MidiTrackClipZoneLines = React.memo(function _MidiTrackClipZoneLines({
	columnWidth, panPixelsX, clipZoneHeight, visibleWidth,
}: Props) {
	const pathD2 = useMemo(() => {
		const startBeat = panPixelsX / columnWidth
		const endBeat = startBeat + (visibleWidth / columnWidth)
		const firstLineBeat = Math.floor(startBeat) % 2 === 0 ? Math.floor(startBeat) : Math.floor(startBeat - 1)
		const lastLineBeat = Math.ceil(endBeat)
		const tempCount = (lastLineBeat - firstLineBeat)
		const division = tempCount < 10
			? 4
			: tempCount < 20
				? 2
				: tempCount > 50
					? 0.5
					: 1
		const count = Math.ceil(tempCount * division)
		console.log({startBeat, endBeat, firstLineBeat, lastLineBeat, count})
		const linesArray = new Array(count).fill(0)
			.map((_, i) => ((firstLineBeat + (i / division)) * columnWidth) - panPixelsX)
		return linesArray.reduce((result, x) => result + `M ${x} 0 L ${x} ${clipZoneHeight}`, '')
	}, [columnWidth, panPixelsX, clipZoneHeight])

	return (
		<svg className="midiTrackClipZoneLines" style={{position: 'absolute', left: 0, width: '100%', height: '100%'}}>
			<path
				d={pathD2}
				strokeWidth={1}
				stroke={CssColor.gray2}
			/>
		</svg>
	)
})
