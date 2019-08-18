import React from 'react'
import {useSelector} from 'react-redux'
import {stripIndents, oneLine} from 'common-tags'
import {
	createPositionColorSelector, createBetterSeqIsRecordingSelector,
	createBetterSeqIsPlayingSelector, createBetterSeqRateSelector,
} from '@corgifm/common/redux'
import {Panel} from '../Panel/Panel'
import {seqLengthValueToString} from '../client-constants'

interface Props {
	id: Id
}

export const BetterSequencer = ({id}: Props) => {
	const color = useSelector(createPositionColorSelector(id))
	const isRecording = useSelector(createBetterSeqIsRecordingSelector(id))
	const isPlaying = useSelector(createBetterSeqIsPlayingSelector(id))
	const rate = useSelector(createBetterSeqRateSelector(id))

	return (
		<Panel
			id={id}
			color={isRecording ? 'red' : color}
			label={name}
			className={oneLine`
				betterSequencer
				playing-${isPlaying}
				recording-${isRecording}
			`}
			saturate={isPlaying}
			extra={seqLengthValueToString(rate / 4 * length)}
			helpText={stripIndents`
				Better Sequencer

				It's better than you
			`}
		>
			hi
		</Panel>
	)
}
