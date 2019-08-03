import React, {useCallback} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {
	selectSamples, basicSamplerActions, selectSamplerViewOctave,
	BasicSamplerState,
} from '@corgifm/common/redux'
import {IMidiNote} from '@corgifm/common/MidiNote'
import {Sample} from '@corgifm/common/common-samples-stuff'
import {ContextMenuTrigger} from 'react-contextmenu'
import {Octave} from '@corgifm/common/common-types'
import {CssColor} from '@corgifm/common/shamu-color'
import {localActions} from '../local-middleware'
import {samplePadMenuId} from '../ContextMenu/SamplePadMenu'
import {KnobIncremental} from '../Knob/KnobIncremental'

interface Props {
	samplerId: string
}

const dummySample: Sample = {
	color: CssColor.panelGrayDark,
	filePath: 'n/a',
	label: '?',
}

export const Samples = ({samplerId}: Props) => {
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
}

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
