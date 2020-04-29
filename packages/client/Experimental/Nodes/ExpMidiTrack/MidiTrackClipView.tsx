import React from 'react'
import {SeqTimelineClip} from '@corgifm/common/SeqStuff'
import {CssColor} from '@corgifm/common/shamu-color'
import {mainBorderRadius} from '../../../client-constants'
import {MidiTrackClipResizer} from './MidiTrackClipResizer'
import {findLowestAndHighestNotes} from '@corgifm/common/common-utils'

interface Props {
	readonly clip: SeqTimelineClip
	readonly columnWidth: number
	readonly panPixelsX: number
	readonly handleMouseDown: (e: MouseEvent, direction: 'left' | 'right' | 'center', clipId: Id) => void
}

export const MidiTrackClipView = ({
	clip, columnWidth, panPixelsX, handleMouseDown,
}: Props) => {
	const startPixel = (clip.startBeat * columnWidth)
	const clipWidth = clip.beatLength * columnWidth
	const {lowestNote, highestNote} = findLowestAndHighestNotes(clip.patternView.pattern.events.filter(x => x.note >= 0))
	const numberOfPossibleNotes = highestNote - lowestNote + 1
	const noteHeightPercentage = 100 / numberOfPossibleNotes
	const noteHeightPercentageDecimal = noteHeightPercentage
	return (
		<div
			className="midiTrackClipViewInner"
			style={{
				height: '100%',
				width: clipWidth,
				borderRadius: 8,
				fontWeight: 600,
				marginLeft: startPixel - panPixelsX,
				display: 'flex',
				flexDirection: 'column',
				position: 'absolute',
				// border: `2px solid currentcolor`,
				// boxSizing: 'border-box',
			}}
		>
			<div className="clipHeader" style={{
				padding: 4, height: 16, backgroundColor: 'currentcolor',
				borderTopRightRadius: mainBorderRadius, borderTopLeftRadius: mainBorderRadius,
				borderBottom: '1px solid ' + CssColor.panelGrayDark}}>
				<div className="clipName" style={{color: CssColor.panelGrayDark, textAlign: 'left', overflow: 'hidden', marginLeft: Math.max(panPixelsX - startPixel, 0)}}>
					{clip.name} clip
				</div>
			</div>
			<div className="notes" style={{backgroundColor: 'currentcolor', mixBlendMode: 'difference', /*backgroundColor: 'rgba(255, 255, 255, 0.16)', */flexGrow: 1, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, position: 'relative'}}>
				<svg style={{width: '100%', height: '100%', position: 'absolute', left: 0, padding: `2px 0`}}>
					{clip.patternView.pattern.events.map(event => {
						return (
							<rect
								key={event.id as string}
								width={columnWidth * event.duration}
								height={noteHeightPercentageDecimal + '%'}
								x={event.startBeat * columnWidth}
								y={((highestNote - event.note) * noteHeightPercentageDecimal) + '%'}
								fill={CssColor.panelGrayDark}
								rx={4}
							/>
						)
					}).toList()}
				</svg>
			</div>
			<MidiTrackClipResizer {...{width: clipWidth, clipId: clip.id, handleMouseDown}} />
		</div>
	)
}
