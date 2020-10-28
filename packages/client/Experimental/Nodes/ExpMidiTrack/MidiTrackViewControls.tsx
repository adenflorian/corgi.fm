import React from 'react'
import {CssColor} from '@corgifm/common/shamu-color'
import {useNodeContext} from '../../CorgiNode'
import {ExpMidiTrackNode} from '../ExpMidiTrackNode'
import {useObjectChangedEvent} from '../../hooks/useCorgiEvent'

interface Props {}

export const MidiTrackViewControls = ({}: Props) => {
	const nodeContext = useNodeContext() as ExpMidiTrackNode
	const track = useObjectChangedEvent(nodeContext.midiTimelineTrackParam.value)

	return (
		<div className="midiTrackViewControlsInner">
			<div
				className="name"
				style={{
					color: CssColor.defaultGray,
					padding: 8,
				}}
			>
				{track.name}
			</div>
		</div>
	)
}