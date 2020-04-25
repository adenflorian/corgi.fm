import React from 'react'
import {SeqTimelineClip} from '@corgifm/common/SeqStuff'
import {CssColor} from '@corgifm/common/shamu-color'

interface Props {
	clip: SeqTimelineClip
}

export const MidiTrackClipView = ({clip}: Props) => {
	return (
		<div
			className="midiTrackClipViewInner"
			style={{
				height: '100%',
				backgroundColor: 'currentcolor',
				width: 200,
				borderRadius: 8,
				fontWeight: 600,
				marginLeft: 16,
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<div className="clipName" style={{color: CssColor.panelGrayDark, padding: 4, height: 16}}>{clip.name} clip</div>
			<div className="notes" style={{backgroundColor: 'rgba(0, 0, 0, 0.75)', flexGrow: 1, borderBottomLeftRadius: 8, borderBottomRightRadius: 8}}></div>
		</div>
	)
}
