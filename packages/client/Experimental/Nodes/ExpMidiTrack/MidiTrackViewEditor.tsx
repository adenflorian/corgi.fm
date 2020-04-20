import React from 'react'
import {CssColor} from '@corgifm/common/shamu-color'
import {useNodeContext} from '../../CorgiNode'
import {ExpMidiTrackNode} from '../ExpMidiTrackNode'
import {useObjectChangedEvent} from '../../hooks/useCorgiEvent'

interface Props {}

export const MidiTrackViewEditor = ({}: Props) => {
	const nodeContext = useNodeContext() as ExpMidiTrackNode
	const track = useObjectChangedEvent(nodeContext.midiTimelineTrackParam.value)

	return (
		<div className="midiTrackViewEditorInner">
			hello!
		</div>
	)
}