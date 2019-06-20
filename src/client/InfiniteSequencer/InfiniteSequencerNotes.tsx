import React from 'react'
import {Dispatch} from 'redux'
import {MidiClipEvents} from '../../common/midi-types'
import {IMidiNote} from '../../common/MidiNote'
import {findLowestAndHighestNotes, InfiniteSequencerStyle, selectInfiniteSequencer, shamuConnect} from '../../common/redux'
import {getColorStringForMidiNote} from '../../common/shamu-color'
import {isWhiteKey} from '../Keyboard/Keyboard'
import {getOctaveFromMidiNote, midiNoteToNoteName} from '../WebAudio'

interface Props {
	id: string
}

interface ReduxProps {
	events: MidiClipEvents
	showRows: boolean
	style: InfiniteSequencerStyle
}

type AllProps = Props & ReduxProps & {dispatch: Dispatch}

export function InfiniteSequencerNotes({style, events, showRows}: AllProps) {

	const {lowestNote, highestNote} = findLowestAndHighestNotes(events)
	const numberOfPossibleNotes = highestNote - lowestNote + 1
	const noteHeightPercentage = 100 / numberOfPossibleNotes
	const rows = [] as any[]

	if (events.count() > 0) {
		for (let i = highestNote; i >= lowestNote; i--) {
			rows.push(i)
		}
	}

	if (style === InfiniteSequencerStyle.colorBars) {
		return (
			<div className={`display ${events.count() > 8 ? 'small' : ''}`}>
				<div className="notes">
					{events.map((event, index) => {
						const note = event.notes.first(-1)

						return (
							< div
								key={index}
								className={`event largeFont`}
								style={{
									backgroundColor: note === -1 ? 'none' : getColorStringForMidiNote(note),
									borderRadius: 4,
								}}
							>
								{note === -1
									? undefined
									: events.count() <= 8
										? midiNoteToNoteName(note) + getOctaveFromMidiNote(note)
										: undefined
								}
							</div>
						)
					},
					)}
				</div>
			</div>
		)
	} else {
		return (
			<div className={`display ${events.count() > 8 ? 'small' : ''}`}>
				<div className="notes">
					{events.map(x => x.notes.first(-1)).map((note, index) =>
						<ColorGridNote
							note={note}
							key={index}
							height={noteHeightPercentage + (note === lowestNote ? 1 : 0)}
							top={(highestNote - note) * noteHeightPercentage}
						/>,
					)}
				</div>
				{showRows &&
					<div className="rows">
						{rows.map(note => (
							<div
								key={note}
								className={`row ${isWhiteKey(note) ? 'white' : 'black'}`}
								style={{
									height: `${noteHeightPercentage + (note === lowestNote ? 1 : 0)}%`,
									top: `${(highestNote - note) * noteHeightPercentage}%`,
									width: '100%',
								}}
							/>
						))}
					</div>
				}
			</div>
		)
	}
}

const ColorGridNote = React.memo(
	function _ColorGridNote({note, height, top}: {note: IMidiNote, height: number, top: number}) {
		return (
			<div className={`event noDrag`}>
				<div
					className={`note`}
					style={{
						backgroundColor: note === -1 ? 'none' : getColorStringForMidiNote(note),
						height: `${height}%`,
						top: `${top}%`,
					}}
				/>
			</div>
		)
	},
)

export const ConnectedInfiniteSequencerNotes = shamuConnect(
	(state, props: Props): ReduxProps => {
		const infiniteSequencerState = selectInfiniteSequencer(state.room, props.id)

		return {
			events: infiniteSequencerState.midiClip.events,
			showRows: infiniteSequencerState.showRows,
			style: infiniteSequencerState.style,
		}
	},
)(InfiniteSequencerNotes)
