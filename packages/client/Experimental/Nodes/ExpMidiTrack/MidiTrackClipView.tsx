import React from 'react'
import {SeqTimelineClip} from '@corgifm/common/SeqStuff'
import {CssColor} from '@corgifm/common/shamu-color'

interface Props {
	readonly clip: SeqTimelineClip
	readonly columnWidth: number
	readonly panPixelsX: number
}

export const MidiTrackClipView = ({
	clip, columnWidth, panPixelsX,
}: Props) => {
	return (
		<div
			className="midiTrackClipViewInner"
			style={{
				height: '100%',
				backgroundColor: 'currentcolor',
				width: clip.beatLength * columnWidth,
				borderRadius: 8,
				fontWeight: 600,
				marginLeft: (clip.startBeat * columnWidth) - panPixelsX,
				display: 'flex',
				flexDirection: 'column',
				position: 'absolute',
			}}
		>
			<div className="clipName" style={{color: CssColor.panelGrayDark, padding: 4, height: 16}}>{clip.name} clip</div>
			<div className="notes" style={{backgroundColor: 'rgba(0, 0, 0, 0.75)', flexGrow: 1, borderBottomLeftRadius: 8, borderBottomRightRadius: 8}}></div>
		</div>
	)
}
