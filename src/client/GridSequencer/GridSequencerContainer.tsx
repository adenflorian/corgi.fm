import * as React from 'react'
import {selectConnectionSourceColorByTargetId, shamuConnect} from '../../common/redux'
import {selectGridSequencer} from '../../common/redux'
import {GridSequencer} from './GridSequencer'
import './GridSequencer.less'

interface Props {
	id: string
}

interface ReduxProps {
	isPlaying: boolean
	color: string
	name: string
	length: number
	rate: number
}

type AllProps = Props & ReduxProps

export const GridSequencerContainer = (props: AllProps) => {
	const {id, color, isPlaying, name, length, rate} = props

	return (
		<GridSequencer
			color={color}
			isPlaying={isPlaying}
			id={id}
			name={name}
			length={length}
			rate={rate}
		/>
	)
}

export const ConnectedGridSequencerContainer = shamuConnect(
	(state, props: Props): ReduxProps => {
		const gridSequencer = selectGridSequencer(state.room, props.id)

		return {
			isPlaying: gridSequencer.isPlaying,
			color: selectConnectionSourceColorByTargetId(state.room, props.id),
			name: gridSequencer.name,
			length: gridSequencer.midiClip.length,
			rate: gridSequencer.rate,
		}
	},
)(GridSequencerContainer)
