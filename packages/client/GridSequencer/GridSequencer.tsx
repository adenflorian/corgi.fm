import {stripIndents} from 'common-tags'
import React from 'react'
import {seqLengthValueToString} from '../client-constants'
import {Panel} from '../Panel/Panel'
import {GridSequencerControlsConnected} from './GridSequencerControls'
import {GridSequencerNotesConnected} from './GridSequencerNotes'

interface IGridSequencerProps {
	color: string
	id: Id
	isPlaying: boolean
	name: string
	length: number
	rate: number
	isRecording: boolean
}

export const GridSequencer = (props: IGridSequencerProps) => {
	const {id, color, isPlaying, name, rate, length, isRecording} = props

	return (
		<Panel
			id={id}
			color={isRecording ? 'red' : color}
			label={name}
			className={`gridSequencer ${isPlaying ? 'isPlaying' : 'isNotPlaying'} ${isRecording ? `isRecording` : ''}`}
			saturate={isPlaying}
			extra={seqLengthValueToString(rate / 4 * length)}
			helpText={stripIndents`
				Shift + left click and drag to delete notes
				Alt + left click and drag to draw notes`}
		>
			<GridSequencerControlsConnected
				id={id}
			/>
			<GridSequencerNotesConnected
				id={id}
			/>
		</Panel>
	)
}
