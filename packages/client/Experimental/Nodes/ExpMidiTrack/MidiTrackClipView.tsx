import React from 'react'
import {SeqTimelineClip} from '@corgifm/common/SeqStuff'
import {CssColor} from '@corgifm/common/shamu-color'
import {mainBorderRadius} from '../../../client-constants'

interface Props {
	readonly clip: SeqTimelineClip
	readonly columnWidth: number
	readonly panPixelsX: number
}

export const MidiTrackClipView = ({
	clip, columnWidth, panPixelsX,
}: Props) => {
	const startPixel = (clip.startBeat * columnWidth)
	return (
		<div
			className="midiTrackClipViewInner"
			style={{
				height: '100%',
				width: clip.beatLength * columnWidth,
				borderRadius: 8,
				fontWeight: 600,
				marginLeft: startPixel - panPixelsX,
				display: 'flex',
				flexDirection: 'column',
				position: 'absolute',
				border: `2px solid currentcolor`,
				boxSizing: 'border-box',
			}}
		>
			<div className="clipHeader" style={{padding: 4, height: 16,
				borderTopRightRadius: mainBorderRadius, borderTopLeftRadius: mainBorderRadius,
				backgroundColor: 'currentcolor', margin: -1}}>
				<div className="clipName" style={{color: CssColor.panelGrayDark, textAlign: 'left', overflow: 'hidden', marginLeft: Math.max(panPixelsX - startPixel, 0)}}>
					{clip.name} clip
				</div>
			</div>
			<div className="notes" style={{backgroundColor: 'rgba(255, 255, 255, 0.16)', flexGrow: 1, borderBottomLeftRadius: 8, borderBottomRightRadius: 8}}></div>
		</div>
	)
}
