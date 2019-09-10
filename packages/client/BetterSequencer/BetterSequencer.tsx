import React from 'react'
import {useSelector} from 'react-redux'
import {oneLine, stripIndents} from 'common-tags'
import {
	createBetterSeqIsPlayingSelector, createBetterSeqIsRecordingSelector,
	createBetterSeqMidiClipSelector, createBetterSeqRateSelector,
	createSmartNodeColorSelector, getNodeInfo,
} from '@corgifm/common/redux'
import {CssColor} from '@corgifm/common/shamu-color'
import {seqLengthValueToString} from '../client-constants'
import {Panel} from '../Panel/Panel'
import './BetterSequencer.less'
import {BetterSequencerInner} from './BetterSequencerInner'

interface Props {
	id: Id
}

export const BetterSequencer = React.memo(function _BetterSequencer({id}: Props) {
	const color = useSelector(createSmartNodeColorSelector(id))
	const isRecording = useSelector(createBetterSeqIsRecordingSelector(id))
	const isPlaying = useSelector(createBetterSeqIsPlayingSelector(id))
	const rate = useSelector(createBetterSeqRateSelector(id))
	const midiClip = useSelector(createBetterSeqMidiClipSelector(id))
	const lengthBeats = midiClip.length

	return (
		<Panel
			id={id}
			color={isRecording ? 'red' : (typeof color === 'string' ? color : CssColor.green)}
			label={getNodeInfo().betterSequencer.typeName}
			className={oneLine`
				betterSequencer
				${isPlaying ? 'isPlaying saturate ' : 'isNotPlaying '}
				${isRecording ? `isRecording` : ''}
			`}
			saturate={isPlaying}
			extra={seqLengthValueToString(rate / 4 * lengthBeats)}
			helpText={stripIndents`
				Better Sequencer

				By the Better Beats Bureau

				It's better than you
			`}
		>
			<BetterSequencerInner id={id} />
		</Panel>
	)
})
