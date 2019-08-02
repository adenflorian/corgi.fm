import React, {useCallback} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {selectSamples} from '@corgifm/common/redux'
import {IMidiNote} from '@corgifm/common/MidiNote'
import {Sample} from '@corgifm/common/common-samples-stuff'
import {Id} from '@corgifm/common/common-types'
import {localActions} from '../local-middleware'

interface Props {
	samplerId: string
}

export const Samples = ({samplerId}: Props) => {
	const samples = useSelector(selectSamples(samplerId))

	return (
		<div className="samples">
			{samples.map((sample, midiNote) =>
				<SamplePad key={midiNote} {...{samplerId, sample, midiNote}} />
			).toList()}
		</div>
	)
}

interface SamplePadProps {
	samplerId: Id
	sample: Sample
	midiNote: IMidiNote
}

const SamplePad = ({samplerId, sample, midiNote}: SamplePadProps) => {
	const dispatch = useDispatch()
	const playNote = useCallback(
		() => dispatch(localActions.playShortNoteOnTarget(samplerId, midiNote)),
		[dispatch, midiNote, samplerId])

	return (
		<div
			className="sample"
			onMouseDown={playNote}
		>
			<div className="label">
				{sample.label}
			</div>
		</div>
	)
}
