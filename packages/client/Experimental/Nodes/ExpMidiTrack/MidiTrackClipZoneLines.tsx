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
const emptyString = ''

export const MidiTrackClipZoneLines = React.memo(function _MidiTrackClipZoneLines({
	columnWidth, panPixelsX, clipZoneHeight, visibleWidth,
}: Props) {
	const measureLines = useMemo(() => {
		const startBeat = panPixelsX / columnWidth
		const endBeat = startBeat + (visibleWidth / columnWidth)
		const firstLineBeat = getNextLowerDivisibleBy4(startBeat)
		const lastLineBeat = getNextHigherDivisibleBy4(endBeat)
		const count = lastLineBeat - firstLineBeat
		return new Array(count / 4)
			.fill(0)
			.map((_, i) => ((firstLineBeat + (i * 4)) * columnWidth) - panPixelsX)
			.reduce((result, x) => result + `M ${x} 0 L ${x} ${clipZoneHeight}`, '')
	}, [columnWidth, panPixelsX, clipZoneHeight, visibleWidth])

	const beatLines = useMemo(() => {
		const distance = columnWidth
		if (distance < 16) return emptyString
		const startBeat = panPixelsX / columnWidth
		const endBeat = startBeat + (visibleWidth / columnWidth)
		const firstLineBeat = Math.floor(startBeat)
		const lastLineBeat = Math.ceil(endBeat)
		const count = lastLineBeat - firstLineBeat
		return new Array(count)
			.fill(0)
			.map((_, i) => firstLineBeat + i)
			.filter(x => (distance < 32 ? (x % 2 === 0) : true) && (x % 4 !== 0))
			.map(x => (x * columnWidth) - panPixelsX)
			.reduce((result, x) => result + `M ${x} 0 L ${x} ${clipZoneHeight}`, '')
	}, [columnWidth, panPixelsX, clipZoneHeight, visibleWidth])

	const smallerLines = useMemo(() => {
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
		return new Array(count)
			.fill(0)
			.map((_, i) => firstLineBeat + (i / division))
			.filter(x => x % 1 !== 0)
			.map(x => (x * columnWidth) - panPixelsX)
			.reduce((result, x) => result + `M ${x} 0 L ${x} ${clipZoneHeight}`, '')
	}, [columnWidth, panPixelsX, clipZoneHeight, visibleWidth])

	return (
		<svg className="midiTrackClipZoneLines" style={{position: 'absolute', left: 0, width: '100%', height: '100%'}}>
			<path
				d={measureLines}
				strokeWidth={2}
				stroke={`hsla(0, 0%, 10%, 1)`}
			/>
			<path
				d={beatLines}
				strokeWidth={2}
				stroke={`hsla(0, 0%, 12%, 1)`}
			/>
			<path
				d={smallerLines}
				strokeWidth={2}
				stroke={`hsla(0, 0%, 13%, 1)`}
			/>
		</svg>
	)
})

function getNextLowerDivisibleBy4(val: number) {
	let x = Math.floor(val)
	if (x % 4 === 0) return x
	x--
	if (x % 4 === 0) return x
	x--
	if (x % 4 === 0) return x
	x--
	return x
}

function getNextHigherDivisibleBy4(val: number) {
	let x = Math.ceil(val)
	if (x % 4 === 0) return x
	x++
	if (x % 4 === 0) return x
	x++
	if (x % 4 === 0) return x
	x++
	return x
}
