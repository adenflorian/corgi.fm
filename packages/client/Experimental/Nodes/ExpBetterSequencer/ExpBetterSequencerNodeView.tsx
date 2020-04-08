import React, {Fragment} from 'react'
import {hot} from 'react-hot-loader'
import {useNumberChangedEvent, useObjectChangedEvent} from '../../hooks/useCorgiEvent'
import {useExpPosition} from '../../../react-hooks'
import {useNodeContext} from '../../CorgiNode'
import {CssColor, getColorStringForMidiNote} from '@corgifm/common/shamu-color'
import {ReadonlyEventStreamReader} from '../EventStreamStuff'
import {ExpBetterSequencerInner} from './ExpBetterSequencerInner'

interface Props {

}

export const ExpBetterSequencerNodeView = hot(module)(React.memo(function _ExpSequencerNodeExtra({

}: Props) {
	const nodeContext = useNodeContext()
	const position = useExpPosition(nodeContext.id)
	// const beatCursor = useNumberChangedEvent(eventStreamReader.beatCursor, true)
	// const currentEvent = useObjectChangedEvent(eventStreamReader.currentEvent)
	// const eventStreamIndex = useNumberChangedEvent(eventStreamReader.eventStream.currentIndex)
	// const loops = useNumberChangedEvent(eventStreamReader.eventStream.loops)
	// const events = useObjectChangedEvent(eventStreamReader.eventStream.events)
	// const eventsBeatLength = useNumberChangedEvent(eventStreamReader.eventStream.beatLength)
	// const innerBeatCursor = useNumberChangedEvent(eventStreamReader.eventStream.beatCursor)
	// const innerBeatCursor2 = useNumberChangedEvent(eventStreamReader.eventStream.beatCursor2)
	// const maxBeat = events.map(x => x.beat).reduce((max, current) => Math.max(current, max), 0)
	const eventsHeight = position.height / 3
	const eventsWidth = position.width - 16
	// const notes = events.map(x => x.note).filter(x => x !== undefined) as readonly number[]
	// const minNote = notes.reduce((min, current) => Math.min(current, min), 127)
	// const maxNote = notes.reduce((max, current) => Math.max(current, max), 0)
	// const noteRange = maxNote - minNote
	// const noteHeight = eventsHeight / noteRange
	const noteWidth = Math.max(position.width / 200, 1)

	// console.log({beatCursor, eventsBeatLength, eventsWidth, innerBeatCursor, innerBeatCursor2})

	return (
		<ExpBetterSequencerInner />
	)
}))

interface Props2 {
}

export const ExpSequencerNodeExtra2 = (function _ExpSequencerNodeExtra({
}: Props2) {
})
