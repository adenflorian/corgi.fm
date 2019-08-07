import React, {useCallback} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {
	selectSamples, basicSamplerActions, selectSamplerViewOctave,
	BasicSamplerState, localActions, createAnimationFrameSelector,
} from '@corgifm/common/redux'
import {IMidiNote} from '@corgifm/common/MidiNote'
import {Sample, dummySample, dummySamplePath} from '@corgifm/common/common-samples-stuff'
import {ContextMenuTrigger} from 'react-contextmenu'
import {Octave} from '@corgifm/common/common-types'
import {CssColor} from '@corgifm/common/shamu-color'
import {samplePadMenuId} from '../ContextMenu/SamplePadMenu'
import {KnobIncremental} from '../Knob/KnobIncremental'
import {noop} from '@corgifm/common/common-utils';

interface Props {
	samplerId: string
}

export const Samples = React.memo(({samplerId}: Props) => {
	const samples = useSelector(selectSamples(samplerId))
	const octave = useSelector(selectSamplerViewOctave(samplerId))
	const dispatch = useDispatch()
	const setOctave = useCallback(
		(_, newOctave) =>
			dispatch(basicSamplerActions.setViewOctave(samplerId, newOctave)),
		[dispatch, samplerId],
	)

	const notesToShow: readonly IMidiNote[] =
		new Array(12).fill(0).map((_, i) => i + (octave * 12) + 12)

	return (
		<div className="samplesSection">
			<div className="samplesControls">
				<ViewOctaveKnob setOctave={setOctave} octave={octave} />
			</div>
			<div className="samplePads">
				{notesToShow.map(midiNote =>
					<SamplePad
						key={midiNote}
						{...{
							samplerId,
							sample: samples.get(midiNote, dummySample),
							midiNote,
						}}
					/>
				)}
			</div>
		</div>
	)
})

interface OctaveKnobProps {
	octave: Octave
	setOctave: (onChangeId: any, newValue: number) => any
}

const ViewOctaveKnob = (props: OctaveKnobProps) => (
	<KnobIncremental
		defaultValue={BasicSamplerState.defaultViewOctave}
		increment={1}
		label={`Octave`}
		min={BasicSamplerState.minViewOctave}
		max={BasicSamplerState.maxViewOctave}
		onChange={props.setOctave}
		tooltip={`Controls which samples are visible based on their octave`}
		value={props.octave}
		sensitivity={0.05}
		valueString={val => val.toFixed(0)}
	/>
)

interface SamplePadProps {
	samplerId: Id
	sample: Sample
	midiNote: IMidiNote
}

const SamplePad = React.memo(({samplerId, sample, midiNote}: SamplePadProps) => {
	const dispatch = useDispatch()
	const playNote = useCallback(
		() => dispatch(localActions.playShortNoteOnTarget(samplerId, midiNote)),
		[dispatch, midiNote, samplerId])
	const frame = useSelector(createAnimationFrameSelector(samplerId, midiNote))

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
				className={`sample ${frame % 2 === 0 ? 'animate1' : ' animate2'}`}
				onMouseDown={sample.filePath === dummySamplePath ? noop : playNote}
				style={{color: CssColor[sample.color]}}
			>
				<div className="label">
					{sample.label}
				</div>
			</div>
		</ContextMenuTrigger>
	)
})
