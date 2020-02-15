import React from 'react'
import {hot} from 'react-hot-loader'
import {useNumberChangedEvent, useObjectChangedEvent} from '../hooks/useCorgiEvent'
import {useExpPosition} from '../../react-hooks'
import {useNodeContext} from '../CorgiNode'
import {CssColor, getColorStringForMidiNote} from '@corgifm/common/shamu-color'
import {ReadonlyEventStreamReader} from './EventStreamStuff'

interface Props {
	eventStreamReader: ReadonlyEventStreamReader
}

export const ExpSequencerNodeExtra = hot(module)(React.memo(function _ExpSequencerNodeExtra({
	eventStreamReader,
}: Props) {
	const nodeContext = useNodeContext()
	const position = useExpPosition(nodeContext.id)
	const beatCursor = useNumberChangedEvent(eventStreamReader.beatCursor, true)
	const currentEvent = useObjectChangedEvent(eventStreamReader.currentEvent)
	const eventStreamIndex = useNumberChangedEvent(eventStreamReader.eventStream.currentIndex)
	const loops = useNumberChangedEvent(eventStreamReader.eventStream.loops)
	const events = useObjectChangedEvent(eventStreamReader.eventStream.events)
	const maxBeat = events.map(x => x.beat).reduce((max, current) => Math.max(current, max))
	const eventsHeight = position.height / 3
	const eventsWidth = position.width - 16
	const eventsBeatLength = useNumberChangedEvent(eventStreamReader.eventStream.beatLength)
	const notes = events.map(x => x.note).filter(x => x !== undefined) as readonly number[]
	const minNote = notes.reduce((min, current) => Math.min(current, min))
	const maxNote = notes.reduce((max, current) => Math.max(current, max))
	const noteRange = maxNote - minNote
	const noteHeight = eventsHeight / noteRange
	const noteWidth = Math.max(position.width / 200, 1)

	return (
		<div
			style={{
				color: CssColor.defaultGray,
				fontSize: 14,
				fontFamily: 'Ubuntu',
			}}
		>
			<div>beatCursor: {beatCursor.toFixed(1)}</div>
			<div>current event:</div>
			<div>beat: {currentEvent.beat}</div>
			<div>gate: {currentEvent.gate ? 'on' : 'off'}</div>
			<div>note: <span style={{color: getColorStringForMidiNote(currentEvent.note || 0)}}>{currentEvent.note}</span></div>
			<div>eventStreamIndex: {eventStreamIndex}</div>
			<div>loops: {loops}</div>
			<div
				className="events"
				style={{
					position: 'relative',
					width: '100%',
					height: eventsHeight,
					margin: '32px 0',
					backgroundColor: CssColor.panelGrayDark,
				}}
			>
				<div className="rightSide" style={{
					width: noteWidth,
					position: 'absolute',
					right: -noteWidth,
					backgroundColor: CssColor.panelGrayLight,
					height: eventsHeight,
				}} />
				{events.map((event, i) => {
					return (
						<div key={i} className="event" style={{
							position: 'absolute',
							left: (event.beat / maxBeat) * eventsWidth,
							width: noteWidth,
							height: noteHeight,
							backgroundColor: event.note === undefined ? CssColor.blue : event.gate ? CssColor.green : CssColor.red,
							top: ((maxNote - (event.note || minNote)) / (noteRange + 1)) * eventsHeight,
						}}></div>
					)
				})}
				<div className="currentTime" style={{
					position: 'absolute',
					height: eventsHeight,
					width: 1,
					backgroundColor: CssColor.defaultGray,
					left: ((beatCursor % eventsBeatLength) / eventsBeatLength) * eventsWidth,
				}}></div>
			</div>
		</div>
	)
}))

interface Props2 {
}

export const ExpSequencerNodeExtra2 = (function _ExpSequencerNodeExtra({
}: Props2) {
})
