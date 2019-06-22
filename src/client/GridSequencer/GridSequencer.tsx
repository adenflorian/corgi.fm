import {stripIndents} from 'common-tags'
import * as React from 'react'
import {seqLengthValueToString} from '../client-constants'
import {Panel} from '../Panel/Panel'
import {GridSequencerControlsConnected} from './GridSequencerControls'
import {GridSequencerNotesConnected} from './GridSequencerNotes'

interface IGridSequencerProps {
	color: string
	id: string
	isPlaying: boolean
	name: string
	length: number
	rate: number
}

export const GridSequencer = (props: IGridSequencerProps) => {
	const {id, color, isPlaying, name, rate, length} = props

	return (
		<Panel
			id={id}
			color={color}
			label={name}
			className={`gridSequencer ${isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
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
