import React, {useCallback} from 'react'
import {ContextMenu, MenuItem, SubMenu} from 'react-contextmenu'
import {useDispatch, useSelector} from 'react-redux'
import {
	basicSamplerActions, selectLocalUserSamples, useLoggedIn,
} from '@corgifm/common/redux'
import {capitalizeFirstLetter} from '@corgifm/common/common-utils'
import {SampleUpload} from '@corgifm/common/models/OtherModels'
import {CssColor} from '@corgifm/common/shamu-color'
import {IMidiNote} from '@corgifm/common/MidiNote'
import {
	Sample, sampleColors, defaultSamples,
} from '@corgifm/common/common-samples-stuff'
import {TopMenuBar} from './TopMenuBar'

interface SamplePadMenuData {
	samplerId: Id
	midiNote: IMidiNote
}

export const samplePadMenuId = 'samplePadMenu'

export const SamplePadMenu = () => {
	return (
		<ContextMenu id={samplePadMenuId}>
			<TopMenuBar label={'sample pad menu'} />
			<ColorsMenu />
			<DefaultSamplesMenu />
			<LocalUserSamplesMenu />
		</ContextMenu>
	)
}

function DefaultSamplesMenu() {
	return (
		<SubMenu
			title={<div>Default Samples...</div>}
			hoverDelay={0}
		>
			{defaultSamples.map((samples, section) => (
				<SubMenu
					key={section}
					title={<div>{section}</div>}
					hoverDelay={0}
				>
					{samples.map((sample, midiNote) => (
						<DefaultSampleMenuItem key={midiNote} {...{sample}} />
					)).toList()}
				</SubMenu>
			)).toList()}
		</SubMenu>
	)
}

function DefaultSampleMenuItem({sample}: {sample: Sample}) {
	const dispatch = useDispatch()
	const setSample = useCallback(
		(samplerId: Id, midiNote: IMidiNote) => {
			dispatch(
				basicSamplerActions.setSample(
					samplerId, midiNote, sample))
		},
		[dispatch, sample],
	)

	return (
		<MenuItem
			onClick={(_, {samplerId, midiNote}: SamplePadMenuData) =>
				setSample(samplerId, midiNote)}
		>
			<span style={{color: CssColor[sample.color]}} className={`defaultSampleMenuItem`}>
				{sample.label}
			</span>
		</MenuItem>
	)
}

function ColorsMenu() {
	return (
		<SubMenu
			title={<div>Color...</div>}
			hoverDelay={0}
		>
			{sampleColors.map(color => <ColorOption key={color} {...{color}} />)}
		</SubMenu>
	)
}

function ColorOption({color}: {color: Sample['color']}) {
	const dispatch = useDispatch()
	const setColor = useCallback(
		(samplerId: Id, midiNote: IMidiNote) => {
			dispatch(
				basicSamplerActions.setSampleColor(
					samplerId, midiNote, color))
		},
		[dispatch, color],
	)

	return (
		<MenuItem
			onClick={(_, {samplerId, midiNote}: SamplePadMenuData) =>
				setColor(samplerId, midiNote)}
		>
			<span style={{color: CssColor[color]}}>
				{capitalizeFirstLetter(color)}
			</span>
		</MenuItem>
	)
}

function LocalUserSamplesMenu() {
	const samples = useSelector(selectLocalUserSamples)

	const isLoggedId = useLoggedIn()

	return (
		<SubMenu
			title={<div>Your Samples...</div>}
			hoverDelay={0}
		>
			{samples.length === 0
				? <MenuItem>
					<span>
						{isLoggedId
							? `Drag file onto pad to upload`
							: `Login to see your uploaded samples`}
					</span>
				</MenuItem>
				: samples.map(sample =>
				<LocalUserSampleMenuItem key={sample.path} {...{sample}} />
			)}
		</SubMenu>
	)
}

function LocalUserSampleMenuItem({sample}: {sample: SampleUpload}) {
	const dispatch = useDispatch()
	const setSample = useCallback(
		(samplerId: Id, midiNote: IMidiNote) => {
			dispatch(
				basicSamplerActions.setSample(
					samplerId, midiNote, sample))
		},
		[dispatch, sample],
	)

	return (
		<MenuItem
			onClick={(_, {samplerId, midiNote}: SamplePadMenuData) =>
				setSample(samplerId, midiNote)}
		>
			<span
				style={{color: CssColor[sample.color]}}
				className={`localUserSampleMenuItem`}
			>
				{sample.label}
			</span>
		</MenuItem>
	)
}
