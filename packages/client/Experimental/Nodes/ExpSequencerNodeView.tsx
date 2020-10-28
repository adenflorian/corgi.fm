import React, {Fragment} from 'react'
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
	const eventsBeatLength = useNumberChangedEvent(eventStreamReader.eventStream.beatLength)
	const innerBeatCursor = useNumberChangedEvent(eventStreamReader.eventStream.beatCursor)
	const innerBeatCursor2 = useNumberChangedEvent(eventStreamReader.eventStream.beatCursor2)
	const maxBeat = events.map(x => x.beat).reduce((max, current) => Math.max(current, max), 0)
	const eventsHeight = position.height / 3
	const eventsWidth = position.width - 16
	const notes = events.map(x => x.note).filter(x => x !== undefined) as readonly number[]
	const minNote = notes.reduce((min, current) => Math.min(current, min), 127)
	const maxNote = notes.reduce((max, current) => Math.max(current, max), 0)
	const noteRange = maxNote - minNote
	const noteHeight = eventsHeight / noteRange
	const noteWidth = Math.max(position.width / 200, 1)

	// console.log({beatCursor, eventsBeatLength, eventsWidth, innerBeatCursor, innerBeatCursor2})

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
			<div>beat: {currentEvent && currentEvent.beat}</div>
			<div>gate: {currentEvent && (currentEvent.gate ? 'on' : 'off')}</div>
			<div>note: <span style={{color: getColorStringForMidiNote((currentEvent && currentEvent.note) || 0)}}>{currentEvent && currentEvent.note}</span></div>
			<div>eventStreamIndex: {eventStreamIndex}</div>
			<div>loops: {loops}</div>
			<div>innerBeatCursor: {innerBeatCursor}</div>
			<div>innerBeatCursor2: {innerBeatCursor2}</div>
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
				{eventsBeatLength <= 0
					? 'uh oh'
					: <Fragment>
						{events.map((event, i) => {
							return (
								<div key={i} className="event" style={{
									position: 'absolute',
									left: (event.beat / eventsBeatLength) * eventsWidth,
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
							left: (((beatCursor % eventsBeatLength) / eventsBeatLength) * eventsWidth || 0),
						}}></div>
						<div className="currentTime" style={{
							position: 'absolute',
							height: eventsHeight / 2,
							width: 1,
							backgroundColor: CssColor.orange,
							left: (((innerBeatCursor % eventsBeatLength) / eventsBeatLength) * eventsWidth || 0),
						}}></div>
						<div className="currentTime" style={{
							position: 'absolute',
							height: eventsHeight / 2,
							top: eventsHeight / 2,
							width: 1,
							backgroundColor: CssColor.purple,
							left: (((innerBeatCursor2 % eventsBeatLength) / eventsBeatLength) * eventsWidth || 0),
						}}></div>
					</Fragment>}
			</div>
		</div>
	)
}))

interface Props2 {
}

export const ExpSequencerNodeExtra2 = (function _ExpSequencerNodeExtra({
}: Props2) {
})
