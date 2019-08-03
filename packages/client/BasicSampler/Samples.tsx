import React, {useCallback} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {selectSamples} from '@corgifm/common/redux'
import {IMidiNote} from '@corgifm/common/MidiNote'
import {Sample} from '@corgifm/common/common-samples-stuff'
import {ContextMenuTrigger} from 'react-contextmenu'
import {localActions} from '../local-middleware'
import {samplePadMenuId} from '../ContextMenu/SamplePadMenu'

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
		/* eslint-disable no-shadow */
		// @ts-ignore disableIfShiftIsPressed
		<ContextMenuTrigger
			id={samplePadMenuId}
			disableIfShiftIsPressed={true}
			holdToDisplay={-1}
			samplerId={samplerId}
			midiNote={midiNote}
			collect={({samplerId, midiNote}) => ({
				samplerId,
				midiNote,
			})}
		>
			<div
				className="sample"
				onMouseDown={playNote}
				style={{color: sample.color}}
			>
				<div className="label">
					{sample.label}
				</div>
			</div>
		</ContextMenuTrigger>
	)
}
