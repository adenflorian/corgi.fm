import React, {useCallback, useState} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {
	selectSamples, basicSamplerActions, selectSamplerViewOctave,
	BasicSamplerState, localActions, createAnimationFrameSelector,
	createUploadStatusSelector,
	chatSystemMessage,
} from '@corgifm/common/redux'
import {IMidiNote} from '@corgifm/common/MidiNote'
import {
	Sample, dummySample, dummySamplePath,
} from '@corgifm/common/common-samples-stuff'
import {ContextMenuTrigger} from 'react-contextmenu'
import {Octave} from '@corgifm/common/common-types'
import {CssColor} from '@corgifm/common/shamu-color'
import {
	noop, MBtoBytes, validateSampleFilenameExtension,
} from '@corgifm/common/common-utils'
import {oneLine} from 'common-tags'
import {
	maxSampleUploadFileSizeMB, allowedSampleUploadFileTypes,
} from '@corgifm/common/common-constants'
import {samplePadMenuId} from '../ContextMenu/SamplePadMenu'
import {KnobIncremental} from '../Knob/KnobIncremental'
import {logger} from '../client-logger'
import {corgiApiActions} from '../RestClient/corgi-api-middleware'

interface Props {
	samplerId: Id
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

// TODO Clean up
const SamplePad = React.memo(
	({samplerId, sample, midiNote}: SamplePadProps) => {
		const dispatch = useDispatch()
		const playNote = useCallback(
			(e: React.MouseEvent) => {
				if (sample.filePath === dummySamplePath) return
				if (e.button !== 0) return
				dispatch(localActions.playShortNoteOnTarget(samplerId, midiNote))
			},
			[dispatch, midiNote, sample, samplerId])
		const frame = useSelector(createAnimationFrameSelector(samplerId, midiNote))
		// Prevents animation while scrolling through octaves
		const [initialFrame] = useState(frame)
		const [dragState, setDragState] = useState<'none' | 'over'>('none')
		const uploadStatus = useSelector(
			createUploadStatusSelector(samplerId, midiNote))

		const label = uploadStatus === 'started'
			? 'Uploading'
			: uploadStatus === 'failed'
				? uploadStatus
				: dragState === 'over'
					? 'Drop to upload'
					: sample.label

		const animateClass = frame === initialFrame
			? ''
			: frame % 2 === 0
				? 'animate1'
				: 'animate2'

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
					className={oneLine`
						sample
						${animateClass}
						drag-${dragState}`}
					onMouseDown={playNote}
					style={{color: CssColor[sample.color]}}
				>
					<div className="label">
						{label}
					</div>
					<div className="sampleFileForm">
						<div
							className="sampleDropZone"
							onDragEnter={e => {
								setDragState('over')
							}}
							onDragLeave={e => {
								setDragState('none')
							}}
							onDragOver={e => {
								e.preventDefault()
								e.dataTransfer.dropEffect = 'move'
							}}
							onDrop={e => {
								e.preventDefault()
								setDragState('none')

								const file = e.dataTransfer.files.item(0)

								if (!file) {
									return logger.warn('onDrop file null: ', e.dataTransfer.files)
								}

								if (file.size > MBtoBytes(maxSampleUploadFileSizeMB)) {
									logger.log({file})
									return dispatch(chatSystemMessage(
										`file size must be under ${maxSampleUploadFileSizeMB}MB`,
										'warning'))
								}

								if (!allowedSampleUploadFileTypes.includes(file.type)) {
									logger.log({file})
									return dispatch(chatSystemMessage(
										oneLine`file must be an allowed type:
											${allowedSampleUploadFileTypes}`,
										'warning'))
								}

								const {error, extension} =
									validateSampleFilenameExtension(file.name)

								if (error) {
									logger.log({error, extension})
									return dispatch(chatSystemMessage(error, 'warning'))
								}

								dispatch(
									corgiApiActions.uploadSample(samplerId, midiNote, file))
							}}
						/>
					</div>
				</div>
			</ContextMenuTrigger>
		)
	}
)
