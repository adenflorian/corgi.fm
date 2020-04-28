import React, {useMemo} from 'react'
import {CssColor} from '@corgifm/common/shamu-color'

interface Props {
	readonly columnWidth: number
	readonly panPixelsX: number
	readonly clipZoneHeight: number
}

export const MidiTrackClipZoneLines = React.memo(function _MidiTrackClipZoneLines({
	columnWidth, panPixelsX, clipZoneHeight,
}: Props) {
	const pathD = useMemo(() => {
		// TODO
		// const startBeat = 
		const count = 128
		const linesArray = new Array(count).fill(0)
			.map((_, i) => (i * columnWidth) - panPixelsX)
		return linesArray.reduce((result, x) => result + `M ${x} 0 L ${x} ${clipZoneHeight}`, '')
	}, [columnWidth, panPixelsX, clipZoneHeight])

	return (
		<svg className="midiTrackClipZoneLines" style={{position: 'absolute', left: 0, width: '100%', height: '100%'}}>
			<path
				d={pathD}
				strokeWidth={1}
				stroke={CssColor.gray2}
			/>
		</svg>
	)
})
