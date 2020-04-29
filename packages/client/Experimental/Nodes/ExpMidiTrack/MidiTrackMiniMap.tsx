import React, {useMemo} from 'react'
import {CssColor} from '@corgifm/common/shamu-color'
import {getMeasureLines, getBeatLines, getSmallerLines} from './MidiTrackLinesHelper'
import {hot} from 'react-hot-loader'

interface Props {
	readonly minimapHeight: number
	readonly visibleWidth: number
	readonly columnWidth: number
	readonly panPixelsX: number
}

export const MidiTrackMiniMap = hot(module)(({
	minimapHeight, visibleWidth, columnWidth, panPixelsX,
}: Props) => {
	const measureLines = useMemo(() => {
		return getMeasureLines(columnWidth, panPixelsX, visibleWidth, minimapHeight)
	}, [columnWidth, panPixelsX, minimapHeight, visibleWidth])

	const beatLines = useMemo(() => {
		return getBeatLines(columnWidth, panPixelsX, visibleWidth, minimapHeight)
	}, [columnWidth, panPixelsX, minimapHeight, visibleWidth])

	const smallerLines = useMemo(() => {
		return getSmallerLines(columnWidth, panPixelsX, visibleWidth, minimapHeight)
	}, [columnWidth, panPixelsX, minimapHeight, visibleWidth])
	return (
		<div
			className="midiTrackMiniMap"
			style={{
				width: visibleWidth,
				height: minimapHeight,
				backgroundColor: CssColor.panelGrayDark,
				position: 'relative',
			}}
		>
			<svg className="midiTrackMiniMapLines" style={{position: 'absolute', left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.2}}>
				<path
					d={measureLines}
					strokeWidth={2}
					stroke={`hsla(0, 0%, 80%, 1)`}
				/>
				<path
					d={beatLines}
					strokeWidth={2}
					stroke={`hsla(0, 0%, 85%, 1)`}
				/>
				<path
					d={smallerLines}
					strokeWidth={2}
					stroke={`hsla(0, 0%, 88%, 1)`}
				/>
			</svg>
		</div>
	)
})
