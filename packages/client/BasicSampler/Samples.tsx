import React, {useCallback, useState} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {
	selectSamples, basicSamplerActions, selectSamplerViewOctave,
	BasicSamplerState, localActions, createAnimationFrameSelector,
	createUploadStatusSelector, chatSystemMessage, useLoggedIn,
	createIsPadSelectedSelector,
} from '@corgifm/common/redux'
import {IMidiNote} from '@corgifm/common/MidiNote'
import {
	Sample, dummySample, dummySamplePath, midiNoteToNoteNameFull,
} from '@corgifm/common/common-samples-stuff'
import {ContextMenuTrigger} from 'react-contextmenu'
import {CssColor} from '@corgifm/common/shamu-color'
import {
	MBtoBytes, validateSampleFilenameExtension,
} from '@corgifm/common/common-utils'
import {
	maxSampleUploadFileSizeMB, allowedSampleUploadFileTypes,
} from '@corgifm/common/common-constants'
import {oneLine} from 'common-tags'
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
	const deselect = useCallback(
		() => dispatch(basicSamplerActions.selectSamplePad(samplerId, undefined)),
		[dispatch, samplerId],
	)

	const notesToShow: readonly IMidiNote[] =
		new Array(12).fill(0).map((_, i) => i + (octave * 12) + 12)

	return (
		<div className="samplesSection">
			<div className="samplesControls">
				<ViewOctaveKnob setOctave={setOctave} octave={octave} />
				<button
					type="button"
					className="deselect corgiButton"
					onClick={deselect}
					title={oneLine`Deselects all samples allowing you to change the
						main instrument params`}
				>
					deselect
				</button>
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

// TODO Clean up more
const SamplePad = React.memo((props: SamplePadProps) => {
	const {samplerId, sample, midiNote} = props

	const dispatch = useDispatch()

	const playNote = useCallback(
		(e: React.MouseEvent) => {
			if (sample.path === dummySamplePath) return
			if (e.button !== 0) return
			dispatch(localActions.playShortNoteOnTarget(samplerId, midiNote))
			dispatch(basicSamplerActions.selectSamplePad(samplerId, midiNote))
		},
		[dispatch, midiNote, sample, samplerId])

	const frame = useSelector(createAnimationFrameSelector(samplerId, midiNote))
	const isSelected = useSelector(createIsPadSelectedSelector(samplerId, midiNote))
	const isLoggedIn = useLoggedIn()
	const uploadStatus = useSelector(
		createUploadStatusSelector(samplerId, midiNote))

	// Prevents animation while scrolling through octaves
	const [initialFrame] = useState(frame)
	const [dragState, setDragState] = useState<'none' | 'over'>('none')

	const label = getLabel()

	return (
		/* eslint-disable no-shadow */
		// @ts-ignore
		<ContextMenuTrigger
			id={samplePadMenuId}
			// @ts-ignore
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
				className={oneLine`sample ${getAnimationClass()} drag-${dragState}
					upload-${uploadStatus} selected-${isSelected}`}
				onMouseDown={playNote}
				style={{color: CssColor[sample.color]}}
				title={midiNoteToNoteNameFull(midiNote) + '\n"' + label +
					'"\n\nDrag files from your computer onto a pad to upload them' +
					'\nTry right clicking'}
			>
				<SampleDropZone {...{setDragState, samplerId, midiNote}}>
					<div className="label">
						{label}
					</div>
				</SampleDropZone>
			</div>
		</ContextMenuTrigger>
	)

	function getLabel() {
		return uploadStatus === 'started'
			? 'Uploading'
			: dragState === 'over'
				? isLoggedIn
					? 'Upload...'
					: 'Login first'
				// Limiting in js because `overflow: hidden` has too big a perf hit
				: sample.label.length > 18
					? sample.label.substr(0, 15) + '...'
					: sample.label
	}

	function getAnimationClass() {
		return frame === initialFrame
			? ''
			: frame % 2 === 0
				? 'animate1'
				: 'animate2'
	}
})

interface SampleDropZoneProps {
	setDragState: React.Dispatch<React.SetStateAction<'none' | 'over'>>
	samplerId: Id
	midiNote: number
	children: React.ReactNode
}

function SampleDropZone(props: SampleDropZoneProps) {
	const {setDragState, samplerId, midiNote, children} = props

	const dispatch = useDispatch()
	const isLoggedIn = useLoggedIn()

	return (
		<div className="sampleFileForm">
			<div
				className="sampleDropZone"
				onDragEnter={e => setDragState('over')}
				onDragLeave={e => setDragState('none')}
				onDragOver={e => {
					e.preventDefault()
					e.dataTransfer.dropEffect = 'move'
				}}
				onDrop={e => {
					e.preventDefault()
					setDragState('none')

					if (!isLoggedIn) {
						return dispatch(
							chatSystemMessage('You must be logged in to upload!', 'warning'))
					}

					const fileOrError = validateDroppedFile(e)

					if (typeof fileOrError === 'string') {
						return dispatch(chatSystemMessage(fileOrError, 'warning'))
					}

					return dispatch(
						corgiApiActions.uploadSample(samplerId, midiNote, fileOrError))
				}}
			>
				{children}
			</div>
		</div>
	)
}

function validateDroppedFile(e: React.DragEvent) {
	const file = e.dataTransfer.files.item(0)

	if (!file) {
		logger.log('onDrop file null: ', e.dataTransfer.files)
		return `file size must be under ${maxSampleUploadFileSizeMB}MB`
	}

	if (file.size > MBtoBytes(maxSampleUploadFileSizeMB)) {
		logger.log('file too big:', {file})
		return `file size must be under ${maxSampleUploadFileSizeMB}MB`
	}

	if (!allowedSampleUploadFileTypes.includes(file.type)) {
		logger.log('invalid file type:', {file})
		return `file must be an allowed type: ${allowedSampleUploadFileTypes}`
	}

	const {error, extension} = validateSampleFilenameExtension(file.name)

	if (error) {
		logger.log(error, {extension})
		return error
	}

	return file
}
