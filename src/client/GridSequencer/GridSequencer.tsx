import * as React from 'react'
import {Panel} from '../Panel'
import {GridSequencerControlsConnected} from './GridSequencerControls'
import {GridSequencerNotesConnected} from './GridSequencerNotes'

interface IGridSequencerProps {
	color: string
	id: string
	isPlaying: boolean
	name: string
}

export const GridSequencer = (props: IGridSequencerProps) => {
	const {id, color, isPlaying, name} = props

	return (
		<div
			className={`gridSequencer ${isPlaying ? 'isPlaying saturate' : 'isNotPlaying'}`}
			style={{color}}
		>
			<div className="label transitionAllColor">{name}</div>
			<Panel id={id}>
				<GridSequencerControlsConnected
					id={id}
				/>
				<GridSequencerNotesConnected
					id={id}
				/>
			</Panel>
		</div>
	)
}
