import React from 'react'
import {useNodeContext} from '../../CorgiNode'
import {ExpMidiTrackNode} from '../ExpMidiTrackNode'
import {useObjectChangedEvent} from '../../hooks/useCorgiEvent'
import {MidiTrackClipView} from './MidiTrackClipView'

interface Props {}

export const MidiTrackClipZone = ({}: Props) => {
	const nodeContext = useNodeContext() as ExpMidiTrackNode
	const track = useObjectChangedEvent(nodeContext.midiTimelineTrackParam.value)

	console.log({track})

	return (
		<div className="midiTrackClipZoneInner" style={{height: '100%'}}>
			{track.timelineClips.map(clip =>
				<MidiTrackClipView
					key={clip.id as string}
					clip={clip}
				/>
			).toList()}
		</div>
	)
}
